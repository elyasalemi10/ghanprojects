import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { authenticator } from 'otplib';
import crypto from 'crypto';

const app = express();

const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function saveEmailSignup(email, source) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('email_signups')
      .insert([{ email, source, created_at: new Date().toISOString() }])
      .select();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ============================================
// AUTH (cookie session, bcrypt, role-based)
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const SESSION_COOKIE = 'gp_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function signSession(user) {
  return jwt.sign(
    {
      sub: user.id, email: user.email, name: user.name, role: user.role,
      borrowerId: user.borrower_id || null, permissions: user.permissions || null,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS, path: '/',
  });
}
function clearSessionCookie(res) { res.clearCookie(SESSION_COOKIE, { path: '/' }); }
function readSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
function requireAuth(roles) {
  return (req, res, next) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    if (roles && roles.length > 0 && !roles.includes(session.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = session; next();
  };
}
function hasPermission(user, resource, action) {
  if (!user) return false;
  if (user.role === 'OWNER') return true;
  if (user.role === 'ADMIN') {
    const perms = user.permissions?.[resource] || [];
    return perms.includes(action);
  }
  return false;
}
function requestMeta(req) {
  return {
    ip_address: (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').trim() || null,
    user_agent: req.headers['user-agent'] || null,
  };
}
async function logAction(req, action, entityType, entityId, details) {
  if (!supabase) return;
  try {
    const meta = requestMeta(req);
    await supabase.from('audit_log').insert({
      user_id: req.user?.sub || null, action, entity_type: entityType,
      entity_id: entityId ? String(entityId) : null, details: details || null,
      ip_address: meta.ip_address, user_agent: meta.user_agent,
    });
  } catch {}
}

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
const totpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many 2FA attempts. Please try again later.' },
});

authenticator.options = { window: 1 };

function signPending2FAToken(userId) {
  return jwt.sign({ sub: userId, purpose: '2fa-pending' }, JWT_SECRET, { expiresIn: '5m' });
}
function verifyPending2FAToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== '2fa-pending') return null;
    return decoded.sub;
  } catch { return null; }
}

app.post('/api/auth/login', authLimiter, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { data: user, error } = await supabase.from('users')
    .select('id, email, name, password_hash, role, borrower_id, permissions, active, totp_enabled')
    .eq('email', String(email).toLowerCase()).maybeSingle();
  if (error || !user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.totp_enabled) {
    return res.json({ success: true, requires2FA: true, pendingToken: signPending2FAToken(user.id) });
  }
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  setSessionCookie(res, signSession(user));
  const redirect = user.role === 'LENDER' ? '/investor' : '/admin';
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, redirect });
});

app.post('/api/auth/2fa/challenge', totpLimiter, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { pendingToken, code } = req.body || {};
  if (!pendingToken || !code) return res.status(400).json({ error: 'pendingToken and code required' });
  const userId = verifyPending2FAToken(pendingToken);
  if (!userId) return res.status(401).json({ error: 'Pending token expired or invalid. Please log in again.' });
  const { data: user } = await supabase.from('users')
    .select('id, email, name, role, borrower_id, permissions, active, totp_secret, totp_enabled')
    .eq('id', userId).maybeSingle();
  if (!user || !user.active || !user.totp_enabled || !user.totp_secret) {
    return res.status(401).json({ error: 'Invalid 2FA state' });
  }
  const valid = authenticator.verify({ token: String(code).replace(/\s+/g, ''), secret: user.totp_secret });
  if (!valid) return res.status(401).json({ error: 'Invalid 2FA code' });
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
  setSessionCookie(res, signSession(user));
  const redirect = user.role === 'LENDER' ? '/investor' : '/admin';
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role }, redirect });
});

app.post('/api/auth/2fa/setup', requireAuth(), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { data: user } = await supabase.from('users').select('email, totp_enabled').eq('id', req.user.sub).maybeSingle();
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA already enabled. Disable it first to re-setup.' });
  const secret = authenticator.generateSecret();
  await supabase.from('users').update({ totp_secret: secret, totp_enabled: false }).eq('id', req.user.sub);
  const otpauthUrl = authenticator.keyuri(user.email, 'Ghan Projects', secret);
  res.json({ secret, otpauthUrl });
});

app.post('/api/auth/2fa/enable', requireAuth(), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code required' });
  const { data: user } = await supabase.from('users').select('totp_secret, totp_enabled').eq('id', req.user.sub).maybeSingle();
  if (!user || !user.totp_secret) return res.status(400).json({ error: 'Run setup first' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA already enabled' });
  const valid = authenticator.verify({ token: String(code).replace(/\s+/g, ''), secret: user.totp_secret });
  if (!valid) return res.status(401).json({ error: 'Invalid code' });
  await supabase.from('users').update({ totp_enabled: true }).eq('id', req.user.sub);
  await logAction(req, '2FA_ENABLED', 'User', req.user.sub);
  res.json({ success: true });
});

app.post('/api/auth/2fa/disable', requireAuth(), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'password required' });
  const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.sub).maybeSingle();
  if (!user) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });
  await supabase.from('users').update({ totp_enabled: false, totp_secret: null }).eq('id', req.user.sub);
  await logAction(req, '2FA_DISABLED', 'User', req.user.sub);
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });
  const { data: user } = await supabase.from('users')
    .select('id, email, name, active').eq('email', String(email).toLowerCase()).maybeSingle();
  if (user && user.active) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await supabase.from('users').update({ reset_token: token, reset_token_expires: expires }).eq('id', user.id);
    const baseUrl = process.env.WEBSITE_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: 'Reset your Ghan Projects password',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2 style="color:#002B49;">Password reset</h2><p>Hi ${user.name},</p><p>We received a request to reset your Ghan Projects portal password. Click the button below to set a new one. This link expires in 1 hour.</p><p style="margin:24px 0;"><a href="${resetUrl}" style="display:inline-block;background:#002B49;color:#fff;padding:14px 28px;text-decoration:none;font-weight:bold;">Reset password</a></p><p style="color:#666;font-size:12px;">If you didn't request this, you can safely ignore this email.</p></div>`,
      });
      await logAction(req, 'PASSWORD_RESET_REQUESTED', 'User', user.id);
    } catch (e) { console.error('Failed to send reset email:', e); }
  }
  res.json({ success: true });
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
  if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const { data: user } = await supabase.from('users')
    .select('id, reset_token_expires, active').eq('reset_token', token).maybeSingle();
  if (!user || !user.active) return res.status(400).json({ error: 'Invalid or expired reset token' });
  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset token expired. Please request a new one.' });
  }
  const password_hash = await bcrypt.hash(newPassword, 12);
  await supabase.from('users').update({
    password_hash, reset_token: null, reset_token_expires: null,
  }).eq('id', user.id);
  await logAction(req, 'PASSWORD_RESET_COMPLETED', 'User', user.id);
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => { clearSessionCookie(res); res.json({ success: true }); });

app.get('/api/auth/me', async (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  let totp_enabled = false;
  if (supabase) {
    const { data } = await supabase.from('users').select('totp_enabled').eq('id', session.sub).maybeSingle();
    totp_enabled = !!data?.totp_enabled;
  }
  res.json({
    id: session.sub, email: session.email, name: session.name, role: session.role,
    borrowerId: session.borrowerId, permissions: session.permissions,
    totpEnabled: totp_enabled,
  });
});

// Legacy admin login - deprecated once a user exists
app.post('/api/admin/login', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const check = await supabase.from('users').select('id', { count: 'exact', head: true });
  const userCount = check.count ?? 0;
  if (userCount > 0) return res.status(410).json({ error: 'Deprecated. Use /api/auth/login.' });
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, bootstrap: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Resources unlock
app.post('/api/resources/unlock', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const websiteUrl = process.env.WEBSITE_URL || 'https://ghanprojects.com.au';
    const verifiedLink = `${websiteUrl}/resources?verified=true`;
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Access Your Free Property Development Resources - Ghan Projects',
      html: `<h2>Welcome to Ghan Projects!</h2><p>Click below to access your resources:</p><a href="${verifiedLink}" style="background:#1a365d;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Access Resources</a>`
    });
    
    if (result.error) return res.status(500).json({ error: 'Failed to send email' });
    await saveEmailSignup(email, 'resources');
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `RESOURCES ACCESS REQUEST\n\nEmail: ${email}`
        })
      });
    }
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Contact: ${name}`,
      html: `<h2>New Contact Form</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'Not provided'}</p><p><strong>Service:</strong> ${service || 'Not specified'}</p><p><strong>Message:</strong> ${message}</p>`
    });
    
    if (result.error) return res.status(500).json({ error: 'Failed to send' });
    await saveEmailSignup(email, 'contact');
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to send' });
  }
});

// Consultation form
app.post('/api/consultation', async (req, res) => {
  const { fullName, name, email, phone, preferredTime, budgetRange, interestType, message } = req.body;
  const userName = fullName || name;
  
  try {
    // Send notification to admin
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `Consultation Request: ${userName}`,
      html: `<h2>New Consultation Request</h2><p><strong>Name:</strong> ${userName}</p><p><strong>Email:</strong> ${email || 'Not provided'}</p><p><strong>Phone:</strong> ${phone || 'Not provided'}</p><p><strong>Preferred Time:</strong> ${preferredTime || 'Not specified'}</p><p><strong>Budget Range:</strong> ${budgetRange || 'Not specified'}</p><p><strong>Interest:</strong> ${interestType || 'Not specified'}</p><p><strong>Message:</strong> ${message || 'None'}</p>`
    });
    
    if (result.error) return res.status(500).json({ error: 'Failed to send' });
    
    // Send confirmation email to user
    if (email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'Your Consultation Request - Ghan Projects',
        html: `
          <h2>Thank you for your consultation request, ${userName}!</h2>
          <p>We've received your request and this is a <strong>tentative booking</strong>. One of our property specialists will review your details and get back to you within 1 business day to confirm a suitable time.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>We'll review your requirements</li>
            <li>A specialist will contact you to confirm the consultation</li>
            <li>We'll discuss whether a phone call or video meeting works best for you</li>
          </ul>
          <p>In the meantime, feel free to explore our <a href="https://ghanprojects.com.au/insights">latest insights</a> or <a href="https://ghanprojects.com.au/resources">free resources</a>.</p>
          <p>Best regards,<br>The Ghan Projects Team</p>
        `
      });
    }
    
    await saveEmailSignup(email || phone, 'consultation');
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `CONSULTATION REQUEST\n\nName: ${userName}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nBudget: ${budgetRange || 'N/A'}\nInterest: ${interestType || 'N/A'}\nPreferred Time: ${preferredTime || 'N/A'}${message ? `\nMessage: ${message}` : ''}`
        })
      });
    }
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to send' });
  }
});

// Investor network
app.post('/api/investor-network', async (req, res) => {
  const { fullName, email, phone, budgetRange, interestType } = req.body;
  if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
  
  try {
    // Send notification to admin
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Investor Network Signup: ${fullName || 'Anonymous'}`,
      html: `<h2>New Investor Network Signup</h2><p><strong>Name:</strong> ${fullName || 'Not provided'}</p><p><strong>Email:</strong> ${email || 'Not provided'}</p><p><strong>Phone:</strong> ${phone || 'Not provided'}</p><p><strong>Budget Range:</strong> ${budgetRange || 'Not specified'}</p><p><strong>Interest:</strong> ${interestType || 'Not specified'}</p>`
    });
    
    if (result.error) return res.status(500).json({ error: 'Failed' });
    
    // Send welcome email to user
    if (email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'Welcome to the Ghan Projects Investor Network',
        html: `
          <h2>Welcome to the Investor Network${fullName ? `, ${fullName}` : ''}!</h2>
          <p>Thank you for joining the Ghan Projects Investor Network. You're now part of an exclusive group of property investors and developers who receive priority access to opportunities.</p>
          <p><strong>What you'll receive:</strong></p>
          <ul>
            <li>First access to off-market development sites</li>
            <li>Strategic joint venture opportunities</li>
            <li>Monthly Melbourne property market insights</li>
            <li>Invitations to exclusive investor events</li>
          </ul>
          <p><strong>Free Resources:</strong></p>
          <p>As a member, you have access to our strategic resources including feasibility checklists, due diligence guides, and JV partnership frameworks. <a href="https://ghanprojects.com.au/resources">Access them here</a>.</p>
          <p>We'll be in touch when opportunities matching your interests become available. In the meantime, feel free to <a href="https://ghanprojects.com.au/book-consultation">book a consultation</a> to discuss your property goals.</p>
          <p>Best regards,<br>The Ghan Projects Team</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">You're receiving this email because you signed up for the Ghan Projects Investor Network. You can unsubscribe at any time by replying to this email.</p>
        `
      });
    }
    
    await saveEmailSignup(email || phone, 'investor_network');
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `INVESTOR NETWORK SIGNUP\n\nName: ${fullName || 'N/A'}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nBudget: ${budgetRange || 'N/A'}\nInterest: ${interestType || 'N/A'}`
        })
      });
    }
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
  const { email, source } = req.body;
  
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  try {
    await saveEmailSignup(email, source || 'newsletter');
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Welcome to Ghan Projects Insights',
      html: `
        <h2>Welcome to Ghan Projects Insights!</h2>
        <p>Thank you for subscribing to our newsletter. You'll now receive monthly strategic insights on Melbourne's property market.</p>
        <p><strong>What to expect:</strong></p>
        <ul>
          <li>Monthly market analysis and trends</li>
          <li>Development insights and case studies</li>
          <li>Investment strategy tips</li>
          <li>Early access to new resources and guides</li>
        </ul>
        <p>In the meantime, explore our <a href="https://ghanprojects.com.au/resources">free resources</a> or <a href="https://ghanprojects.com.au/book-consultation">book a consultation</a> to discuss your property goals.</p>
        <p>Best regards,<br>The Ghan Projects Team</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">You can unsubscribe at any time by replying to this email.</p>
      `
    });
    
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `📧 NEWSLETTER SIGNUP\n\nEmail: ${email}\nSource: ${source || 'newsletter'}`
        })
      });
    }
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Get blog posts
app.get('/api/posts', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Admin posts
app.get('/api/admin/posts', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create post
app.post('/api/admin/posts', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  const { title, category, thumbnail, date, read_time, content, excerpt, published } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{ title, category, thumbnail, date, read_time, content, excerpt, published: published || false, created_at: new Date().toISOString() }])
      .select();
    
    if (error) throw error;
    res.json({ success: true, post: data[0] });
  } catch {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
app.put('/api/admin/posts/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  const { title, category, thumbnail, date, read_time, content, excerpt, published } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ title, category, thumbnail, date, read_time, content, excerpt, published, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, post: data[0] });
  } catch {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/admin/posts/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Admin signups
app.get('/api/admin/signups', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  
  try {
    const { data, error } = await supabase
      .from('email_signups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch signups' });
  }
});

// Admin send email
app.post('/api/admin/send-email', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  const { senderName, senderPrefix, recipientEmail, subject, body, isHtml } = req.body;
  const fromEmail = `${senderName} <${senderPrefix}@ghanprojects.com.au>`;
  
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: isHtml === 'true' || isHtml === true ? body : `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</pre>`
    });
    
    if (result.error) return res.status(500).json({ error: 'Failed to send email' });
    res.json({ success: true, id: result.data?.id });
  } catch {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ============================================
// CHATBOT
// ============================================

const getMelbourneTime = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));

const isWithin48Hours = (dateStr) => {
  const now = getMelbourneTime();
  const targetDate = new Date(dateStr);
  const diffHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours < 48;
};

const formatDateForCal = (date) => date.toISOString().split('T')[0];

async function checkAvailability(date) {
  if (isWithin48Hours(date)) {
    return { error: true, message: "We are fully booked within the next 48 hours. Please check availability for a date at least 48 hours from now." };
  }
  
  // Check if date is a weekend (Saturday=6, Sunday=0)
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { error: true, message: "We're not available on weekends. Please choose a weekday (Monday to Friday)." };
  }
  
  if (!process.env.CAL_COM_API_KEY || !process.env.CAL_COM_EVENT_TYPE_ID) {
    return { error: true, message: "Calendar system not configured." };
  }
  
  try {
    const dateObj = new Date(date);
    const startTime = new Date(dateObj);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(dateObj);
    endTime.setHours(23, 59, 59, 999);
    
    const url = `https://api.cal.com/v2/slots/available?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&eventTypeId=${process.env.CAL_COM_EVENT_TYPE_ID}`;
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${process.env.CAL_COM_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status === 'error') {
      return { error: true, message: "Unable to check availability at this time." };
    }
    
    const availableSlots = [];
    const slots = data.data?.slots || data.slots || {};
    const dateKey = Object.keys(slots)[0];
    const slotsForDate = dateKey ? slots[dateKey] : [];
    
    for (const slot of slotsForDate) {
      const slotTime = new Date(slot.time);
      const melbourneHour = parseInt(slotTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false }));
      
      if (melbourneHour >= 10 && melbourneHour < 16) {
        availableSlots.push({
          time: slotTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', hour: 'numeric', minute: '2-digit', hour12: true }),
          hour: melbourneHour,
          minute: parseInt(slotTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', minute: '2-digit' })),
          isoTime: slot.time
        });
      }
    }
    
    const formattedDate = new Date(date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
    
    if (availableSlots.length === 0) {
      return { available: false, date: dateObj.toISOString().split('T')[0], message: `No available slots on ${formattedDate} between 10am-4pm. Please try another date.` };
    }
    
    const formatHour = (h) => h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`;
    
    const ranges = [];
    let rangeStart = availableSlots[0];
    let prevSlot = availableSlots[0];
    
    for (let i = 1; i < availableSlots.length; i++) {
      const curr = availableSlots[i];
      const prevMinutes = prevSlot.hour * 60 + prevSlot.minute;
      const currMinutes = curr.hour * 60 + curr.minute;
      
      if (currMinutes - prevMinutes > 15) {
        ranges.push({ start: rangeStart, end: prevSlot });
        rangeStart = curr;
      }
      prevSlot = curr;
    }
    ranges.push({ start: rangeStart, end: prevSlot });
    
    const rangeDescriptions = ranges.map(r => {
      const startHour = formatHour(r.start.hour);
      const endMinutes = r.end.hour * 60 + r.end.minute + 15;
      const endHour = Math.floor(endMinutes / 60);
      const endFormatted = formatHour(endHour);
      
      if (startHour === endFormatted || r.start === r.end) {
        return `${r.start.time} (ISO: ${r.start.isoTime})`;
      }
      return `${startHour} to ${endFormatted}`;
    });
    
    const slotOptions = availableSlots.slice(0, 6).map(s => `${s.time} (ISO: ${s.isoTime})`);
    
    return {
      available: true,
      date: dateObj.toISOString().split('T')[0],
      slots: availableSlots,
      message: `Available on ${formattedDate}: ${rangeDescriptions.join(', ')}. Specific slots the user can book: ${slotOptions.join(', ')}. Use the ISO time when booking.`
    };
  } catch {
    return { error: true, message: "Unable to check availability at this time." };
  }
}

async function bookMeeting(name, email, phone, dateTime) {
  if (isWithin48Hours(dateTime)) {
    return { error: true, message: "Cannot book within 48 hours. Please select a later time." };
  }
  
  if (!email && !phone) {
    return { error: true, message: "Please provide either an email address or phone number to book." };
  }
  
  if (!process.env.CAL_COM_API_KEY || !process.env.CAL_COM_EVENT_TYPE_ID) {
    return { error: true, message: "Calendar system not configured." };
  }
  
  try {
    const bookingData = {
      start: dateTime,
      eventTypeId: parseInt(process.env.CAL_COM_EVENT_TYPE_ID),
      attendee: {
        name: name,
        email: email || `${phone.replace(/\D/g, '')}@phone.placeholder.com`,
        timeZone: 'Australia/Melbourne',
        language: 'en'
      },
      metadata: phone && !email ? { phone: phone } : {}
    };
    
    const response = await fetch('https://api.cal.com/v2/bookings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${process.env.CAL_COM_API_KEY}`
      },
      body: JSON.stringify(bookingData)
    });
    
    const result = await response.json();
    
    if (!response.ok || result.status === 'error') {
      return { error: true, message: "Unable to complete booking. The slot may no longer be available." };
    }
    
    // Send Telegram notification
    console.log('[Chatbot] Attempting Telegram notification for booking...');
    console.log('[Chatbot] TELEGRAM_BOT_TOKEN set:', !!process.env.TELEGRAM_BOT_TOKEN);
    console.log('[Chatbot] TELEGRAM_CHAT_ID set:', !!process.env.TELEGRAM_CHAT_ID);
    
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const bookingTime = new Date(dateTime).toLocaleString('en-AU', { 
        timeZone: 'Australia/Melbourne', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
      });
      
      try {
        const telegramRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `CHATBOT BOOKING\n\nName: ${name}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nTime: ${bookingTime}`
          })
        });
        const telegramData = await telegramRes.json();
        console.log('[Chatbot] Telegram response:', JSON.stringify(telegramData));
      } catch (telegramErr) {
        console.error('[Chatbot] Telegram error:', telegramErr);
      }
    } else {
      console.log('[Chatbot] Telegram not configured, skipping notification');
    }
    
    const confirmedTime = new Date(dateTime).toLocaleString('en-AU', { 
      timeZone: 'Australia/Melbourne', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    
    return { success: true, message: `Booking confirmed for ${name} on ${confirmedTime}. Our team will be in touch shortly to confirm if you prefer a phone call or Google Meet.` };
  } catch {
    return { error: true, message: "Unable to complete booking at this time." };
  }
}

async function sendInquiry(name, email, phone, budget, message) {
  if (!email && !phone) {
    return { error: true, message: "Please provide either an email address or phone number." };
  }
  
  if (!budget) {
    return { error: true, message: "Please provide your budget range." };
  }
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Chatbot Inquiry: ${name}`,
      html: `<h2>New Inquiry from Website Chatbot</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email || 'Not provided'}</p><p><strong>Phone:</strong> ${phone || 'Not provided'}</p><p><strong>Budget:</strong> ${budget}</p>${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}`
    });
    
    if (result.error) {
      return { error: true, message: "Unable to send inquiry at this time." };
    }
    
    await saveEmailSignup(email || phone, 'chatbot_inquiry');
    
    // Send Telegram notification
    console.log('[Chatbot] Attempting Telegram notification for inquiry...');
    console.log('[Chatbot] TELEGRAM_BOT_TOKEN set:', !!process.env.TELEGRAM_BOT_TOKEN);
    console.log('[Chatbot] TELEGRAM_CHAT_ID set:', !!process.env.TELEGRAM_CHAT_ID);
    
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const telegramRes = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `CHATBOT INQUIRY\n\nName: ${name}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nBudget: ${budget}${message ? `\nMessage: ${message}` : ''}`
          })
        });
        const telegramData = await telegramRes.json();
        console.log('[Chatbot] Telegram response:', JSON.stringify(telegramData));
      } catch (telegramErr) {
        console.error('[Chatbot] Telegram error:', telegramErr);
      }
    } else {
      console.log('[Chatbot] Telegram not configured, skipping notification');
    }
    
    return { success: true, message: `Thank you ${name}! Your inquiry has been submitted. Our team will be in touch within 24 hours.` };
  } catch {
    return { error: true, message: "Unable to send inquiry at this time." };
  }
}

const chatTools = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available consultation times on a specific date. Only use for dates at least 48 hours from now.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "The date to check in YYYY-MM-DD format" }
        },
        required: ["date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_meeting",
      description: "Book a consultation meeting. Use the exact isoTime from availability check.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "User's full name" },
          email: { type: "string", description: "User's email (optional if phone provided)" },
          phone: { type: "string", description: "User's phone (optional if email provided)" },
          dateTime: { type: "string", description: "ISO 8601 UTC datetime from availability check" }
        },
        required: ["name", "dateTime"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_inquiry",
      description: "Send a general inquiry. Collects name, contact info, budget, and optional message.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "User's full name" },
          email: { type: "string", description: "User's email (optional if phone provided)" },
          phone: { type: "string", description: "User's phone (optional if email provided)" },
          budget: { type: "string", description: "User's budget range" },
          message: { type: "string", description: "Optional message or note from the user" }
        },
        required: ["name", "budget"]
      }
    }
  }
];

const getSystemPrompt = () => {
  const now = getMelbourneTime();
  const currentDate = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Melbourne' });
  const currentTime = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' });
  
  return `You are a focused assistant for Ghan Projects, a Melbourne-based property development and investment consulting firm.

CURRENT DATE AND TIME (Melbourne/Australia):
- Date: ${currentDate}
- Time: ${currentTime}

STRICT SCOPE - You ONLY help with:
1. Answering questions about Ghan Projects' services
2. Booking 15-minute consultations
3. Collecting inquiry details from potential clients

REJECT OFF-TOPIC REQUESTS:
- If someone asks you to write essays, stories, code, or anything unrelated, politely decline
- Say: "I'm here to help with Ghan Projects consultations and property questions. How can I assist?"
- Do NOT engage with hypothetical scenarios, roleplay, or unrelated questions

KEY INFORMATION:
- Services: Property Advisory, Buyer's Agent, Joint Venture Structuring, Development Management
- Location: Melbourne, Victoria, Australia
- Consultation hours: 10am - 4pm Melbourne time, Monday to Friday

ABOUT THE CONSULTATION:
- It's a FREE 15-minute introductory call
- Purpose: To understand the client's property goals and how we can help
- After booking, our team will reach out to confirm whether they prefer a phone call or Google Meet
- This is just an initial chat - no commitment required
- Do NOT mention email confirmations - we handle follow-up directly

BOOKING FLOW:
1. When user wants to check availability, call check_availability with their requested date
2. Present availability as time ranges (e.g., "We're free from 10am to 12pm") not individual slots
3. Ask what time within that range works best for them
4. Collect: name AND (email OR phone number)
5. Call book_meeting with the ISO time from the availability response

INQUIRY FLOW (user not ready to book):
1. Get name, contact (email/phone), and budget
2. Ask if they have any message or note they'd like to pass to the team (optional)
3. Call send_inquiry tool

Keep responses SHORT and friendly. Max 2-3 sentences.`;
};

app.post('/api/chat', async (req, res) => {
  if (!openai) {
    return res.status(500).json({ error: 'Chat service not configured' });
  }
  
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }
  
  const systemPrompt = getSystemPrompt();
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      tools: chatTools,
      tool_choice: 'auto',
      max_tokens: 500
    });
    
    const assistantMessage = response.choices[0].message;
    
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      const firstToolUsed = assistantMessage.tool_calls[0].function.name;
      
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result;
        
        switch (toolCall.function.name) {
          case 'check_availability':
            result = await checkAvailability(args.date);
            break;
          case 'book_meeting':
            result = await bookMeeting(args.name, args.email, args.phone, args.dateTime);
            break;
          case 'send_inquiry':
            result = await sendInquiry(args.name, args.email, args.phone, args.budget, args.message);
            break;
          default:
            result = { error: true, message: 'Unknown tool' };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result)
        });
      }
      
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages, assistantMessage, ...toolResults],
        max_tokens: 500
      });
      
      return res.json({
        message: finalResponse.choices[0].message.content,
        toolUsed: firstToolUsed
      });
    }
    
    res.json({ message: assistantMessage.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// ============================================
// LENDING PLATFORM
// ============================================
const dbReady = (req, res) => {
  if (!supabase) { res.status(500).json({ error: 'Database not configured' }); return false; }
  return true;
};

// Borrowers
app.get('/api/admin/borrowers', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'borrowers', 'view')) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('borrowers').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/borrowers', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'borrowers', 'create')) return res.status(403).json({ error: 'Forbidden' });
  const { full_name, email, phone, address, id_number, id_type, notes, custom_fields } = req.body || {};
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email required' });
  const { data, error } = await supabase.from('borrowers').insert({
    full_name, email: String(email).toLowerCase(), phone, address, id_number, id_type, notes,
    custom_fields: custom_fields || null,
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BORROWER_CREATED', 'Borrower', data.id, { full_name, email });
  res.status(201).json(data);
});
app.put('/api/admin/borrowers/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'borrowers', 'edit')) return res.status(403).json({ error: 'Forbidden' });
  const { full_name, email, phone, address, id_number, id_type, notes, custom_fields, active } = req.body || {};
  const update = { full_name, email: email ? String(email).toLowerCase() : undefined, phone, address, id_number, id_type, notes, custom_fields, active };
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  const { data, error } = await supabase.from('borrowers').update(update).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BORROWER_UPDATED', 'Borrower', req.params.id, update);
  res.json(data);
});
app.delete('/api/admin/borrowers/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { count } = await supabase.from('loans').select('id', { count: 'exact', head: true }).eq('borrower_id', req.params.id);
  if ((count ?? 0) > 0) return res.status(400).json({ error: 'Cannot delete borrower with loans' });
  const { error } = await supabase.from('borrowers').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BORROWER_DELETED', 'Borrower', req.params.id);
  res.json({ success: true });
});

// Projects
app.get('/api/admin/projects', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'projects', 'view')) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/projects', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'projects', 'create')) return res.status(403).json({ error: 'Forbidden' });
  const { name, description, address, status, total_cost, total_revenue, total_profit, start_date, estimated_completion, actual_completion, custom_fields } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const { data, error } = await supabase.from('projects').insert({
    name, description, address, status: status || 'PLANNING',
    total_cost: total_cost ?? null, total_revenue: total_revenue ?? null, total_profit: total_profit ?? null,
    start_date: start_date || null, estimated_completion: estimated_completion || null,
    actual_completion: actual_completion || null, custom_fields: custom_fields || null,
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'PROJECT_CREATED', 'Project', data.id, { name });
  res.status(201).json(data);
});
app.put('/api/admin/projects/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'projects', 'edit')) return res.status(403).json({ error: 'Forbidden' });
  const update = { ...req.body }; delete update.id; delete update.created_at; delete update.updated_at;
  const { data, error } = await supabase.from('projects').update(update).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'PROJECT_UPDATED', 'Project', req.params.id, update);
  res.json(data);
});
app.delete('/api/admin/projects/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { count } = await supabase.from('loans').select('id', { count: 'exact', head: true }).eq('project_id', req.params.id);
  if ((count ?? 0) > 0) return res.status(400).json({ error: 'Cannot delete project with loans attached' });
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'PROJECT_DELETED', 'Project', req.params.id);
  res.json({ success: true });
});

// Atomic project + bank loan creation
app.post('/api/admin/projects/with-bank-loan', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'projects', 'create')) return res.status(403).json({ error: 'Forbidden' });
  const { project, bankLoan } = req.body || {};
  if (!project?.name) return res.status(400).json({ error: 'project.name required' });
  const { data: newProject, error: pErr } = await supabase.from('projects').insert({
    name: project.name, description: project.description || null, address: project.address || null,
    status: project.status || 'PLANNING',
    total_cost: project.total_cost ?? null, total_revenue: project.total_revenue ?? null, total_profit: project.total_profit ?? null,
    cost_line_items: project.cost_line_items || null, revenue_line_items: project.revenue_line_items || null,
    start_date: project.start_date || null, estimated_completion: project.estimated_completion || null,
    actual_completion: project.actual_completion || null, custom_fields: project.custom_fields || null,
  }).select().single();
  if (pErr) return res.status(400).json({ error: pErr.message });
  await logAction(req, 'PROJECT_CREATED', 'Project', newProject.id, { name: project.name });

  let createdBankLoan = null;
  if (bankLoan && bankLoan.bank_key && bankLoan.bank_name) {
    const { data: bl, error: blErr } = await supabase.from('bank_loans').insert({
      project_id: newProject.id,
      bank_key: bankLoan.bank_key, bank_name: bankLoan.bank_name,
      loan_account_number: bankLoan.loan_account_number || null,
      loan_type: bankLoan.loan_type || 'CONSTRUCTION', loan_type_other: bankLoan.loan_type_other || null,
      secured: bankLoan.secured ?? true, secured_to: bankLoan.secured_to || null,
      facility_limit: bankLoan.facility_limit ?? null, amount_drawn: bankLoan.amount_drawn ?? null, amount_available: bankLoan.amount_available ?? null,
      interest_rate: bankLoan.interest_rate ?? null, interest_rate_type: bankLoan.interest_rate_type || 'FIXED',
      interest_rate_pegged_to: bankLoan.interest_rate_pegged_to || null, interest_rate_date: bankLoan.interest_rate_date || null,
      settlement_date: bankLoan.settlement_date || null, maturity_date: bankLoan.maturity_date || null,
      io_period_months: bankLoan.io_period_months ?? null, pi_period_months: bankLoan.pi_period_months ?? null,
      io_start_date: bankLoan.io_start_date || null, io_end_date: bankLoan.io_end_date || null,
      pi_start_date: bankLoan.pi_start_date || null, pi_end_date: bankLoan.pi_end_date || null,
      interest_rate_benchmark: bankLoan.interest_rate_benchmark || null,
      interest_rate_margin: bankLoan.interest_rate_margin ?? null,
      repayment_frequency: bankLoan.repayment_frequency || null, min_monthly_repayment: bankLoan.min_monthly_repayment ?? null,
      direct_debit_day: bankLoan.direct_debit_day ?? null, debit_bsb: bankLoan.debit_bsb || null, debit_account_number: bankLoan.debit_account_number || null,
      establishment_fee: bankLoan.establishment_fee ?? null, ongoing_fees: bankLoan.ongoing_fees || null, early_repayment_terms: bankLoan.early_repayment_terms || null,
      loan_agreement_url: bankLoan.loan_agreement_url || null, mortgage_documents_url: bankLoan.mortgage_documents_url || null, valuation_report_url: bankLoan.valuation_report_url || null,
      covenants: bankLoan.covenants || null, notes: bankLoan.notes || null,
    }).select().single();
    if (blErr) {
      await supabase.from('projects').delete().eq('id', newProject.id);
      return res.status(400).json({ error: `Bank loan creation failed: ${blErr.message}. Project rolled back.` });
    }
    createdBankLoan = bl;
    await logAction(req, 'BANK_LOAN_CREATED', 'BankLoan', bl.id, { project_id: newProject.id, bank: bankLoan.bank_name });
  }
  res.status(201).json({ project: newProject, bankLoan: createdBankLoan });
});

// Bank loans CRUD
app.get('/api/admin/bank-loans', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { projectId } = req.query;
  let q = supabase.from('bank_loans').select('*, project:projects(id, name, status)').order('created_at', { ascending: false });
  if (projectId) q = q.eq('project_id', String(projectId));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.get('/api/admin/bank-loans/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('bank_loans').select('*, project:projects(id, name, status)').eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});
app.post('/api/admin/bank-loans', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const b = req.body || {};
  if (!b.bank_key || !b.bank_name || !b.loan_type) return res.status(400).json({ error: 'bank_key, bank_name, loan_type required' });
  const { data, error } = await supabase.from('bank_loans').insert({
    project_id: b.project_id || null,
    bank_key: b.bank_key, bank_name: b.bank_name, loan_account_number: b.loan_account_number || null,
    loan_type: b.loan_type, loan_type_other: b.loan_type_other || null,
    secured: b.secured ?? true, secured_to: b.secured_to || null,
    facility_limit: b.facility_limit ?? null, amount_drawn: b.amount_drawn ?? null, amount_available: b.amount_available ?? null,
    interest_rate: b.interest_rate ?? null, interest_rate_type: b.interest_rate_type || 'FIXED',
    interest_rate_pegged_to: b.interest_rate_pegged_to || null, interest_rate_date: b.interest_rate_date || null,
    settlement_date: b.settlement_date || null, maturity_date: b.maturity_date || null,
    io_period_months: b.io_period_months ?? null, pi_period_months: b.pi_period_months ?? null,
    io_start_date: b.io_start_date || null, io_end_date: b.io_end_date || null,
    pi_start_date: b.pi_start_date || null, pi_end_date: b.pi_end_date || null,
    interest_rate_benchmark: b.interest_rate_benchmark || null,
    interest_rate_margin: b.interest_rate_margin ?? null,
    repayment_frequency: b.repayment_frequency || null, min_monthly_repayment: b.min_monthly_repayment ?? null,
    direct_debit_day: b.direct_debit_day ?? null, debit_bsb: b.debit_bsb || null, debit_account_number: b.debit_account_number || null,
    establishment_fee: b.establishment_fee ?? null, ongoing_fees: b.ongoing_fees || null, early_repayment_terms: b.early_repayment_terms || null,
    loan_agreement_url: b.loan_agreement_url || null, mortgage_documents_url: b.mortgage_documents_url || null, valuation_report_url: b.valuation_report_url || null,
    covenants: b.covenants || null, notes: b.notes || null,
  }).select('*, project:projects(id, name, status)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BANK_LOAN_CREATED', 'BankLoan', data.id, { project_id: data.project_id, bank: data.bank_name });
  res.status(201).json(data);
});
app.put('/api/admin/bank-loans/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const update = { ...req.body }; delete update.id; delete update.created_at; delete update.updated_at; delete update.project;
  const { data, error } = await supabase.from('bank_loans').update(update).eq('id', req.params.id)
    .select('*, project:projects(id, name, status)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BANK_LOAN_UPDATED', 'BankLoan', req.params.id, Object.keys(update));
  res.json(data);
});
app.delete('/api/admin/bank-loans/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { error } = await supabase.from('bank_loans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'BANK_LOAN_DELETED', 'BankLoan', req.params.id);
  res.json({ success: true });
});

// Loans
app.get('/api/admin/loans', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'loans', 'view')) return res.status(403).json({ error: 'Forbidden' });
  const { status, projectId, borrowerId } = req.query;
  let q = supabase.from('loans').select('*, borrower:borrowers(id, full_name, email), project:projects(id, name, status)').order('created_at', { ascending: false });
  if (status) q = q.eq('status', String(status));
  if (projectId) q = q.eq('project_id', String(projectId));
  if (borrowerId) q = q.eq('borrower_id', String(borrowerId));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.get('/api/admin/loans/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('loans')
    .select('*, borrower:borrowers(*), project:projects(*), transactions(*)')
    .eq('id', req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});
app.post('/api/admin/loans', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'loans', 'create')) return res.status(403).json({ error: 'Forbidden' });
  const { borrower_id, project_id, loan_type, principal, interest_rate, profit_share_percent, start_date, maturity_date, term_months, payment_amount, payment_day, notes, custom_fields, status } = req.body || {};
  if (!borrower_id || !loan_type || principal == null || interest_rate == null || !start_date || !maturity_date || !term_months) return res.status(400).json({ error: 'Missing required fields' });
  if (!['FIXED_MONTHLY','FIXED_END','PROFIT_SHARE'].includes(loan_type)) return res.status(400).json({ error: 'Invalid loan_type' });
  if (loan_type === 'PROFIT_SHARE' && !project_id) return res.status(400).json({ error: 'PROFIT_SHARE loans must be linked to a project' });
  const { data, error } = await supabase.from('loans').insert({
    borrower_id, project_id: project_id || null, loan_type, principal, current_balance: principal, interest_rate,
    profit_share_percent: profit_share_percent ?? null, start_date, maturity_date, term_months,
    payment_amount: payment_amount ?? null, payment_day: payment_day ?? null, notes: notes ?? null,
    custom_fields: custom_fields ?? null, status: status || 'PENDING',
  }).select('*, borrower:borrowers(id, full_name, email), project:projects(id, name)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'LOAN_CREATED', 'Loan', data.id, { principal, borrower_id, loan_type });
  res.status(201).json(data);
});
app.put('/api/admin/loans/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'loans', 'edit')) return res.status(403).json({ error: 'Forbidden' });
  const update = { ...req.body }; delete update.id; delete update.created_at; delete update.updated_at; delete update.reference;
  delete update.borrower; delete update.project; delete update.transactions;
  const { data, error } = await supabase.from('loans').update(update).eq('id', req.params.id)
    .select('*, borrower:borrowers(id, full_name, email), project:projects(id, name)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'LOAN_UPDATED', 'Loan', req.params.id, update);
  res.json(data);
});
app.delete('/api/admin/loans/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('loan_id', req.params.id);
  if ((count ?? 0) > 0) return res.status(400).json({ error: 'Cannot delete loan with transactions' });
  const { error } = await supabase.from('loans').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'LOAN_DELETED', 'Loan', req.params.id);
  res.json({ success: true });
});

// Transactions
app.get('/api/admin/transactions', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'transactions', 'view')) return res.status(403).json({ error: 'Forbidden' });
  const { loanId, from, to } = req.query;
  let q = supabase.from('transactions')
    .select('*, loan:loans(id, reference, borrower:borrowers(id, full_name), project:projects(id, name))')
    .order('payment_date', { ascending: false });
  if (loanId) q = q.eq('loan_id', String(loanId));
  if (from) q = q.gte('payment_date', String(from));
  if (to) q = q.lte('payment_date', String(to));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/transactions', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'transactions', 'create')) return res.status(403).json({ error: 'Forbidden' });
  const { loan_id, type, amount, payment_date, reference, notes, interest_portion, principal_portion } = req.body || {};
  if (!loan_id || !type || amount == null || !payment_date) return res.status(400).json({ error: 'loan_id, type, amount, payment_date required' });
  if (!['INTEREST_PAYMENT','PRINCIPAL_PAYMENT','PROFIT_DISTRIBUTION','DISBURSEMENT','TOP_UP','EARLY_REPAYMENT'].includes(type)) return res.status(400).json({ error: 'Invalid transaction type' });

  const { data: loan, error: loanErr } = await supabase.from('loans').select('id, principal, current_balance').eq('id', loan_id).maybeSingle();
  if (loanErr || !loan) return res.status(404).json({ error: 'Loan not found' });

  const amt = Number(amount);
  const balance = Number(loan.current_balance);
  const principal = Number(loan.principal);
  let nextBalance = balance, nextPrincipal = principal;
  if (type === 'TOP_UP') { nextBalance = balance + amt; nextPrincipal = principal + amt; }
  else if (type === 'PRINCIPAL_PAYMENT' || type === 'EARLY_REPAYMENT') { nextBalance = Math.max(0, balance - amt); }

  const { data: tx, error: txErr } = await supabase.from('transactions').insert({
    loan_id, type, amount: amt, payment_date, reference: reference ?? null, notes: notes ?? null,
    interest_portion: interest_portion ?? null, principal_portion: principal_portion ?? null, created_by_id: req.user.sub,
  }).select().single();
  if (txErr) return res.status(400).json({ error: txErr.message });

  if (nextBalance !== balance || nextPrincipal !== principal) {
    await supabase.from('loans').update({ current_balance: nextBalance, principal: nextPrincipal }).eq('id', loan_id);
  }
  await logAction(req, 'TRANSACTION_CREATED', 'Transaction', tx.id, { loan_id, type, amount: amt });
  res.status(201).json(tx);
});

// ============================================
// LENDING — Dashboard, Inflows, Statements, Requests, Users, Audit
// ============================================

// Dashboard (owner only)
app.get('/api/admin/dashboard', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const monthsAhead = Math.max(1, Math.min(24, Number(req.query.months || '12')));
  const { data: activeLoans, error: loansErr } = await supabase.from('loans')
    .select('id, reference, loan_type, principal, current_balance, interest_rate, term_months, payment_amount, payment_day, maturity_date, status, borrower:borrowers(id, full_name), project:projects(id, name)')
    .in('status', ['ACTIVE', 'PENDING']);
  if (loansErr) return res.status(500).json({ error: loansErr.message });

  const totalOutstanding = (activeLoans || []).reduce((s, l) => s + Number(l.current_balance), 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setMonth(horizon.getMonth() + monthsAhead);

  const { data: inflows, error: infErr } = await supabase.from('estimated_inflows')
    .select('id, description, amount, expected_date, confidence, project:projects(id, name)')
    .gte('expected_date', today.toISOString().split('T')[0])
    .lte('expected_date', horizon.toISOString().split('T')[0])
    .order('expected_date', { ascending: true });
  if (infErr) return res.status(500).json({ error: infErr.message });

  const months = [];
  for (let i = 0; i < monthsAhead; i++) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const monthInflows = (inflows || []).filter((inf) => {
      const d = new Date(inf.expected_date); return d >= monthStart && d <= monthEnd;
    });
    const inflowTotal = monthInflows.reduce((s, inf) => s + Number(inf.amount), 0);
    let outflowTotal = 0; const outflowDetail = [];
    for (const loan of activeLoans || []) {
      if (loan.loan_type === 'FIXED_MONTHLY') {
        const pa = Number(loan.payment_amount || 0);
        if (pa > 0) {
          const pd = new Date(monthStart.getFullYear(), monthStart.getMonth(), loan.payment_day || 1);
          if (pd < today) continue;
          if (pd > new Date(loan.maturity_date)) continue;
          outflowTotal += pa;
          outflowDetail.push({ loanId: loan.id, borrower: loan.borrower?.full_name, date: pd.toISOString(), amount: pa });
        }
      } else if (loan.loan_type === 'FIXED_END' || loan.loan_type === 'PROFIT_SHARE') {
        const m = new Date(loan.maturity_date);
        if (m >= monthStart && m <= monthEnd) {
          const annual = Number(loan.principal) * (Number(loan.interest_rate) / 100);
          const total = annual * (Number(loan.term_months) / 12) + Number(loan.principal);
          outflowTotal += total;
          outflowDetail.push({
            loanId: loan.id, borrower: loan.borrower?.full_name, date: m.toISOString(), amount: total,
            note: loan.loan_type === 'PROFIT_SHARE' ? 'Maturity payout (excludes profit share)' : 'Maturity payout',
          });
        }
      }
    }
    months.push({
      year: monthStart.getFullYear(), month: monthStart.getMonth() + 1,
      label: monthStart.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      expectedInflows: inflowTotal, scheduledOutflows: outflowTotal, net: inflowTotal - outflowTotal,
      inflows: monthInflows.map((inf) => ({
        id: inf.id, description: inf.description, amount: Number(inf.amount),
        expectedDate: inf.expected_date, confidence: inf.confidence, project: inf.project,
      })),
      outflowDetail,
    });
  }
  let running = 0;
  const projection = months.map((m) => { running += m.net; return { label: m.label, runningPosition: running }; });
  const loansByType = (activeLoans || []).reduce((acc, l) => { acc[l.loan_type] = (acc[l.loan_type] || 0) + 1; return acc; }, {});
  res.json({
    summary: {
      totalOutstanding, activeLoanCount: (activeLoans || []).length, loansByType,
      forecastWindow: { from: today.toISOString(), to: horizon.toISOString(), months: monthsAhead },
      totalExpectedInflows: months.reduce((s, m) => s + m.expectedInflows, 0),
      totalScheduledOutflows: months.reduce((s, m) => s + m.scheduledOutflows, 0),
      netForecast: months.reduce((s, m) => s + m.net, 0),
    },
    months, projection,
    activeLoans: (activeLoans || []).map((l) => ({
      id: l.id, reference: l.reference, borrower: l.borrower, project: l.project,
      loanType: l.loan_type, currentBalance: Number(l.current_balance),
      interestRate: Number(l.interest_rate), maturityDate: l.maturity_date,
    })),
  });
});

// Inflows (owner only)
app.get('/api/admin/inflows', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('estimated_inflows')
    .select('*, project:projects(id, name)').order('expected_date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/inflows', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { description, amount, expected_date, project_id, confidence, notes } = req.body || {};
  if (!description || amount == null || !expected_date) return res.status(400).json({ error: 'description, amount, expected_date required' });
  const { data, error } = await supabase.from('estimated_inflows').insert({
    description, amount: Number(amount), expected_date,
    project_id: project_id || null, confidence: confidence || 'LIKELY', notes: notes || null,
  }).select('*, project:projects(id, name)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'INFLOW_CREATED', 'EstimatedInflow', data.id, { description, amount });
  res.status(201).json(data);
});
app.put('/api/admin/inflows/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const update = { ...req.body }; delete update.id; delete update.created_at; delete update.updated_at; delete update.project;
  const { data, error } = await supabase.from('estimated_inflows').update(update).eq('id', req.params.id)
    .select('*, project:projects(id, name)').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'INFLOW_UPDATED', 'EstimatedInflow', req.params.id, update);
  res.json(data);
});
app.delete('/api/admin/inflows/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { error } = await supabase.from('estimated_inflows').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'INFLOW_DELETED', 'EstimatedInflow', req.params.id);
  res.json({ success: true });
});

// Statements
function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
async function buildInvestorStatement(borrowerId, from, to) {
  const { data: borrower } = await supabase.from('borrowers').select('id, full_name, email, phone, address').eq('id', borrowerId).maybeSingle();
  if (!borrower) throw new Error('Borrower not found');
  const { data: loans } = await supabase.from('loans').select('*, project:projects(id, name, status), transactions(*)').eq('borrower_id', borrowerId);
  const loanSummaries = (loans || []).map((l) => {
    const txs = (l.transactions || []).filter((t) => t.payment_date >= from && t.payment_date <= to);
    const interestPaid = txs.filter((t) => t.type === 'INTEREST_PAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const principalPaid = txs.filter((t) => t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const profitDist = txs.filter((t) => t.type === 'PROFIT_DISTRIBUTION').reduce((s, t) => s + Number(t.amount), 0);
    const topUps = txs.filter((t) => t.type === 'TOP_UP').reduce((s, t) => s + Number(t.amount), 0);
    return {
      loanId: l.id, reference: l.reference, project: l.project, loanType: l.loan_type,
      principal: Number(l.principal), currentBalance: Number(l.current_balance),
      interestRate: Number(l.interest_rate),
      profitSharePercent: l.profit_share_percent ? Number(l.profit_share_percent) : null,
      startDate: l.start_date, maturityDate: l.maturity_date, status: l.status,
      periodTotals: { interestPaid, principalPaid, profitDistributions: profitDist, topUps, totalReceived: interestPaid + principalPaid + profitDist },
      transactions: txs.sort((a, b) => a.payment_date.localeCompare(b.payment_date)).map((t) => ({
        date: t.payment_date, type: t.type, amount: Number(t.amount), reference: t.reference,
      })),
    };
  });
  const totals = loanSummaries.reduce((acc, l) => ({
    interestPaid: acc.interestPaid + l.periodTotals.interestPaid,
    principalPaid: acc.principalPaid + l.periodTotals.principalPaid,
    profitDistributions: acc.profitDistributions + l.periodTotals.profitDistributions,
    totalReceived: acc.totalReceived + l.periodTotals.totalReceived,
    currentBalance: acc.currentBalance + l.currentBalance,
  }), { interestPaid: 0, principalPaid: 0, profitDistributions: 0, totalReceived: 0, currentBalance: 0 });
  return { type: 'investor', period: { from, to }, investor: borrower, totals, loans: loanSummaries, generatedAt: new Date().toISOString() };
}
async function buildProjectStatement(projectId, from, to) {
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (!project) throw new Error('Project not found');
  const { data: loans } = await supabase.from('loans').select('*, borrower:borrowers(id, full_name, email), transactions(*)').eq('project_id', projectId);
  const loanSummaries = (loans || []).map((l) => {
    const txs = (l.transactions || []).filter((t) => t.payment_date >= from && t.payment_date <= to);
    const interestPaid = txs.filter((t) => t.type === 'INTEREST_PAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const principalPaid = txs.filter((t) => t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT').reduce((s, t) => s + Number(t.amount), 0);
    const profitDist = txs.filter((t) => t.type === 'PROFIT_DISTRIBUTION').reduce((s, t) => s + Number(t.amount), 0);
    return {
      borrower: l.borrower, loanRef: l.reference,
      principal: Number(l.principal), currentBalance: Number(l.current_balance),
      interestRate: Number(l.interest_rate),
      profitSharePercent: l.profit_share_percent ? Number(l.profit_share_percent) : null,
      periodTotals: { interestPaid, principalPaid, profitDist, total: interestPaid + principalPaid + profitDist },
    };
  });
  const totals = loanSummaries.reduce((acc, l) => ({
    interestPaid: acc.interestPaid + l.periodTotals.interestPaid,
    principalPaid: acc.principalPaid + l.periodTotals.principalPaid,
    profitDistributions: acc.profitDistributions + l.periodTotals.profitDist,
    totalDistributed: acc.totalDistributed + l.periodTotals.total,
    totalCapital: acc.totalCapital + l.currentBalance,
  }), { interestPaid: 0, principalPaid: 0, profitDistributions: 0, totalDistributed: 0, totalCapital: 0 });
  return {
    type: 'project', period: { from, to },
    project: { id: project.id, name: project.name, status: project.status,
      totalCost: project.total_cost ? Number(project.total_cost) : null,
      totalRevenue: project.total_revenue ? Number(project.total_revenue) : null,
      totalProfit: project.total_profit ? Number(project.total_profit) : null },
    investorCount: loanSummaries.length, totals, investors: loanSummaries,
    generatedAt: new Date().toISOString(),
  };
}
async function buildCombinedStatement(from, to) {
  const { data: txs } = await supabase.from('transactions')
    .select('*, loan:loans(reference, borrower:borrowers(id, full_name, email), project:projects(id, name))')
    .gte('payment_date', from).lte('payment_date', to).order('payment_date', { ascending: true });
  const byInvestor = {}, byProject = {};
  const generalLoans = { interestPaid: 0, principalPaid: 0, profitDistributions: 0, total: 0, count: 0 };
  const grand = { interestPaid: 0, principalPaid: 0, profitDistributions: 0, topUps: 0, total: 0, transactionCount: (txs || []).length };
  for (const t of txs || []) {
    const amt = Number(t.amount);
    const k = t.loan?.borrower?.id;
    if (k) {
      const v = byInvestor[k] = byInvestor[k] || { borrower: t.loan.borrower, interestPaid: 0, principalPaid: 0, profitDistributions: 0, topUps: 0, total: 0, count: 0 };
      v.count++;
      if (t.type === 'INTEREST_PAYMENT') { v.interestPaid += amt; v.total += amt; }
      else if (t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT') { v.principalPaid += amt; v.total += amt; }
      else if (t.type === 'PROFIT_DISTRIBUTION') { v.profitDistributions += amt; v.total += amt; }
      else if (t.type === 'TOP_UP') { v.topUps += amt; }
    }
    const projKey = t.loan?.project?.id;
    const target = projKey
      ? (byProject[projKey] = byProject[projKey] || { project: t.loan.project, interestPaid: 0, principalPaid: 0, profitDistributions: 0, total: 0, count: 0 })
      : generalLoans;
    target.count++;
    if (t.type === 'INTEREST_PAYMENT') { target.interestPaid += amt; target.total += amt; }
    else if (t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT') { target.principalPaid += amt; target.total += amt; }
    else if (t.type === 'PROFIT_DISTRIBUTION') { target.profitDistributions += amt; target.total += amt; }
    if (t.type === 'INTEREST_PAYMENT') { grand.interestPaid += amt; grand.total += amt; }
    else if (t.type === 'PRINCIPAL_PAYMENT' || t.type === 'EARLY_REPAYMENT') { grand.principalPaid += amt; grand.total += amt; }
    else if (t.type === 'PROFIT_DISTRIBUTION') { grand.profitDistributions += amt; grand.total += amt; }
    else if (t.type === 'TOP_UP') { grand.topUps += amt; }
  }
  return {
    type: 'combined', period: { from, to },
    grandTotals: grand,
    byInvestor: Object.values(byInvestor),
    byProject: Object.values(byProject),
    generalCompanyLoans: generalLoans,
    transactions: (txs || []).map((t) => ({
      date: t.payment_date, type: t.type, amount: Number(t.amount),
      borrower: t.loan?.borrower?.full_name || '—',
      project: t.loan?.project?.name || 'General',
      loanRef: t.loan?.reference, reference: t.reference,
    })),
    generatedAt: new Date().toISOString(),
  };
}
function statementToCsv(statement, type) {
  const rows = [];
  if (type === 'combined') {
    rows.push('Date,Type,Borrower,Project,Loan Reference,Amount (AUD),Bank Reference');
    for (const t of statement.transactions) {
      rows.push([t.date, t.type, csvEscape(t.borrower), csvEscape(t.project), t.loanRef, t.amount.toFixed(2), csvEscape(t.reference || '')].join(','));
    }
    rows.push('', 'SUMMARY');
    rows.push(`Total Interest Paid,${statement.grandTotals.interestPaid.toFixed(2)}`);
    rows.push(`Total Principal Paid,${statement.grandTotals.principalPaid.toFixed(2)}`);
    rows.push(`Total Profit Distributions,${statement.grandTotals.profitDistributions.toFixed(2)}`);
    rows.push(`Total Top-Ups Received,${statement.grandTotals.topUps.toFixed(2)}`);
  } else if (type === 'investor') {
    rows.push(`Investor Statement: ${statement.investor.full_name}`);
    rows.push(`Period: ${statement.period.from} to ${statement.period.to}`);
    rows.push('', 'Loan Reference,Project,Type,Principal,Current Balance,Interest Paid,Principal Paid,Profit Distributed');
    for (const l of statement.loans) {
      rows.push([
        l.reference, csvEscape(l.project?.name || 'General'), l.loanType,
        l.principal.toFixed(2), l.currentBalance.toFixed(2),
        l.periodTotals.interestPaid.toFixed(2), l.periodTotals.principalPaid.toFixed(2),
        l.periodTotals.profitDistributions.toFixed(2),
      ].join(','));
    }
  } else if (type === 'project') {
    rows.push(`Project Statement: ${statement.project.name}`);
    rows.push(`Period: ${statement.period.from} to ${statement.period.to}`);
    rows.push('', 'Investor,Loan Reference,Principal,Current Balance,Interest Paid,Principal Paid,Profit Distributed');
    for (const inv of statement.investors) {
      rows.push([
        csvEscape(inv.borrower.full_name), inv.loanRef,
        inv.principal.toFixed(2), inv.currentBalance.toFixed(2),
        inv.periodTotals.interestPaid.toFixed(2), inv.periodTotals.principalPaid.toFixed(2),
        inv.periodTotals.profitDist.toFixed(2),
      ].join(','));
    }
  }
  return rows.join('\n');
}
app.get('/api/admin/statements', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.user.role === 'ADMIN' && !hasPermission(req.user, 'statements', 'generate')) return res.status(403).json({ error: 'Forbidden' });
  const { type = 'investor', borrowerId, projectId, from, to, format = 'json' } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to are required (YYYY-MM-DD)' });
  try {
    let statement;
    if (type === 'investor') {
      if (!borrowerId) return res.status(400).json({ error: 'borrowerId required' });
      statement = await buildInvestorStatement(String(borrowerId), String(from), String(to));
    } else if (type === 'project') {
      if (!projectId) return res.status(400).json({ error: 'projectId required' });
      statement = await buildProjectStatement(String(projectId), String(from), String(to));
    } else if (type === 'combined') {
      statement = await buildCombinedStatement(String(from), String(to));
    } else {
      return res.status(400).json({ error: 'Invalid statement type' });
    }
    if (format === 'csv') {
      const csv = statementToCsv(statement, String(type));
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="statement_${type}_${from}_to_${to}.csv"`);
      return res.send(csv);
    }
    res.json(statement);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Statement generation failed' });
  }
});

// Repayment Requests
app.get('/api/admin/repayment-requests', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('repayment_requests')
    .select('*, loan:loans(id, reference, current_balance, borrower:borrowers(id, full_name))')
    .order('requested_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/repayment-requests/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { status, review_notes } = req.body || {};
  if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { data: existing } = await supabase.from('repayment_requests').select('id, loan_id, requested_amount, status').eq('id', req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Not found' });
  let transaction_id = null;
  if (status === 'COMPLETED') {
    const { data: loan } = await supabase.from('loans').select('id, current_balance').eq('id', existing.loan_id).maybeSingle();
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const amt = Number(existing.requested_amount);
    const newBal = Math.max(0, Number(loan.current_balance) - amt);
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      loan_id: existing.loan_id, type: 'EARLY_REPAYMENT', amount: amt,
      payment_date: new Date().toISOString().split('T')[0],
      notes: 'Auto-created from repayment request', created_by_id: req.user.sub,
    }).select().single();
    if (txErr) return res.status(400).json({ error: txErr.message });
    await supabase.from('loans').update({ current_balance: newBal }).eq('id', existing.loan_id);
    transaction_id = tx.id;
  }
  const update = { status, review_notes: review_notes || null, reviewed_at: new Date().toISOString(), reviewed_by_id: req.user.sub };
  if (status === 'COMPLETED') { update.completed_at = new Date().toISOString(); update.transaction_id = transaction_id; }
  const { data, error } = await supabase.from('repayment_requests').update(update).eq('id', req.params.id)
    .select('*, loan:loans(id, reference, borrower:borrowers(id, full_name))').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, `REPAYMENT_REQUEST_${status}`, 'RepaymentRequest', req.params.id, { transaction_id });
  res.json(data);
});

// Top-Up Requests
app.get('/api/admin/topup-requests', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('topup_requests')
    .select('*, loan:loans(id, reference, current_balance, borrower:borrowers(id, full_name))')
    .order('requested_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/topup-requests/:id', requireAuth(['OWNER','ADMIN']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { status, review_notes } = req.body || {};
  if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { data: existing } = await supabase.from('topup_requests').select('id, loan_id, amount, status').eq('id', req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Not found' });
  let transaction_id = null;
  if (status === 'COMPLETED') {
    const { data: loan } = await supabase.from('loans').select('id, principal, current_balance').eq('id', existing.loan_id).maybeSingle();
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    const amt = Number(existing.amount);
    const newPrincipal = Number(loan.principal) + amt;
    const newBal = Number(loan.current_balance) + amt;
    const { data: tx, error: txErr } = await supabase.from('transactions').insert({
      loan_id: existing.loan_id, type: 'TOP_UP', amount: amt,
      payment_date: new Date().toISOString().split('T')[0],
      notes: 'Auto-created from top-up request', created_by_id: req.user.sub,
    }).select().single();
    if (txErr) return res.status(400).json({ error: txErr.message });
    await supabase.from('loans').update({ principal: newPrincipal, current_balance: newBal }).eq('id', existing.loan_id);
    transaction_id = tx.id;
  }
  const update = { status, review_notes: review_notes || null, reviewed_at: new Date().toISOString(), reviewed_by_id: req.user.sub };
  if (status === 'COMPLETED') { update.completed_at = new Date().toISOString(); update.transaction_id = transaction_id; }
  const { data, error } = await supabase.from('topup_requests').update(update).eq('id', req.params.id)
    .select('*, loan:loans(id, reference, borrower:borrowers(id, full_name))').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, `TOPUP_REQUEST_${status}`, 'TopUpRequest', req.params.id, { transaction_id });
  res.json(data);
});

// Users (owner only)
app.get('/api/admin/users', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('users')
    .select('id, email, name, role, phone, active, borrower_id, permissions, last_login, created_at, borrower:borrowers(id, full_name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/users', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { email, name, password, role, phone, borrower_id, permissions } = req.body || {};
  if (!email || !name || !password || !role) return res.status(400).json({ error: 'email, name, password, role required' });
  if (!['OWNER', 'ADMIN', 'LENDER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (role === 'LENDER' && !borrower_id) return res.status(400).json({ error: 'LENDER accounts require borrower_id' });
  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('users').insert({
    email: String(email).toLowerCase(), name, password_hash, role,
    phone: phone || null, borrower_id: borrower_id || null,
    permissions: role === 'ADMIN' ? (permissions || null) : null, active: true,
  }).select('id, email, name, role, phone, active, borrower_id, permissions, last_login, created_at').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'USER_CREATED', 'User', data.id, { email, role });
  res.status(201).json(data);
});
app.put('/api/admin/users/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const { email, name, password, role, phone, borrower_id, permissions, active } = req.body || {};
  const update = {};
  if (email != null) update.email = String(email).toLowerCase();
  if (name != null) update.name = name;
  if (role != null) update.role = role;
  if (phone !== undefined) update.phone = phone || null;
  if (borrower_id !== undefined) update.borrower_id = borrower_id || null;
  if (permissions !== undefined) update.permissions = permissions || null;
  if (active != null) update.active = active;
  if (password) update.password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('users').update(update).eq('id', req.params.id)
    .select('id, email, name, role, phone, active, borrower_id, permissions, last_login, created_at').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'USER_UPDATED', 'User', req.params.id, Object.keys(update));
  res.json(data);
});
app.delete('/api/admin/users/:id', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  if (req.params.id === req.user.sub) return res.status(400).json({ error: 'Cannot delete your own account' });
  const { error } = await supabase.from('users').update({ active: false }).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'USER_DEACTIVATED', 'User', req.params.id);
  res.json({ success: true });
});

// Audit log (owner only)
app.get('/api/admin/audit-log', requireAuth(['OWNER']), async (req, res) => {
  if (!dbReady(req, res)) return;
  const limit = Math.min(500, Number(req.query.limit || '100'));
  const { entityType, action } = req.query;
  let q = supabase.from('audit_log').select('*, user:users(id, email, name)').order('created_at', { ascending: false }).limit(limit);
  if (entityType) q = q.eq('entity_type', String(entityType));
  if (action) q = q.ilike('action', `%${String(action)}%`);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================================
// INVESTOR PORTAL
// ============================================
const requireLenderWithBorrower = (req, res, next) => {
  if (req.user.role !== 'LENDER') return res.status(403).json({ error: 'Forbidden' });
  if (!req.user.borrowerId) return res.status(403).json({ error: 'Account is not linked to a borrower record' });
  next();
};

app.get('/api/investor/me', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data: borrower, error } = await supabase.from('borrowers')
    .select('id, full_name, email, phone, address, id_number, id_type, notes, custom_fields, active, created_at')
    .eq('id', req.user.borrowerId).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!borrower) return res.status(404).json({ error: 'Borrower record not found' });
  const { data: loans } = await supabase.from('loans')
    .select('id, status, current_balance, principal, loan_type, interest_rate, maturity_date, payment_amount, payment_day')
    .eq('borrower_id', req.user.borrowerId);
  const totalInvested = (loans || []).reduce((s, l) => s + Number(l.current_balance), 0);
  const activeCount = (loans || []).filter((l) => l.status === 'ACTIVE' || l.status === 'PENDING').length;
  let nextPayment = null;
  const today = new Date();
  for (const l of loans || []) {
    if (l.loan_type !== 'FIXED_MONTHLY' || !l.payment_day || !l.payment_amount) continue;
    if (l.status !== 'ACTIVE' && l.status !== 'PENDING') continue;
    const candidate = new Date(today.getFullYear(), today.getMonth(), l.payment_day);
    if (candidate < today) candidate.setMonth(candidate.getMonth() + 1);
    if (candidate > new Date(l.maturity_date)) continue;
    if (!nextPayment || candidate < new Date(nextPayment.date)) {
      nextPayment = { date: candidate.toISOString().split('T')[0], amount: Number(l.payment_amount) };
    }
  }
  res.json({ borrower, summary: { totalInvested, activeCount, totalLoans: (loans || []).length, nextPayment } });
});

app.put('/api/investor/me', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { phone, currentPassword, newPassword } = req.body || {};
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required to change password' });
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.sub).maybeSingle();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.sub);
    await logAction(req, 'PASSWORD_CHANGED', 'User', req.user.sub);
  }
  if (phone !== undefined) {
    await supabase.from('borrowers').update({ phone: phone || null }).eq('id', req.user.borrowerId);
    await logAction(req, 'BORROWER_SELF_UPDATED', 'Borrower', req.user.borrowerId, { phone });
  }
  res.json({ success: true });
});

app.get('/api/investor/loans', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('loans')
    .select('*, project:projects(id, name, status), borrower:borrowers(id, full_name)')
    .eq('borrower_id', req.user.borrowerId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/investor/loans/:id', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data, error } = await supabase.from('loans')
    .select('*, project:projects(id, name, status), transactions(*)')
    .eq('id', req.params.id).eq('borrower_id', req.user.borrowerId).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

app.get('/api/investor/transactions', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { from, to, loanId } = req.query;
  const { data: ownLoans } = await supabase.from('loans').select('id').eq('borrower_id', req.user.borrowerId);
  const ownIds = (ownLoans || []).map((l) => l.id);
  if (ownIds.length === 0) return res.json([]);
  if (loanId && !ownIds.includes(String(loanId))) return res.status(403).json({ error: 'Forbidden' });
  let q = supabase.from('transactions')
    .select('*, loan:loans(id, reference, project:projects(id, name))')
    .in('loan_id', loanId ? [String(loanId)] : ownIds)
    .order('payment_date', { ascending: false });
  if (from) q = q.gte('payment_date', String(from));
  if (to) q = q.lte('payment_date', String(to));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/investor/statements', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { from, to, format = 'json' } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to are required (YYYY-MM-DD)' });
  try {
    const statement = await buildInvestorStatement(req.user.borrowerId, String(from), String(to));
    if (format === 'csv') {
      const csv = statementToCsv(statement, 'investor');
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="my-statement_${from}_to_${to}.csv"`);
      return res.send(csv);
    }
    res.json(statement);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Statement generation failed' });
  }
});

app.get('/api/investor/repayment-requests', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data: ownLoans } = await supabase.from('loans').select('id').eq('borrower_id', req.user.borrowerId);
  const ownIds = (ownLoans || []).map((l) => l.id);
  if (ownIds.length === 0) return res.json([]);
  const { data, error } = await supabase.from('repayment_requests')
    .select('*, loan:loans(id, reference, current_balance, project:projects(id, name))')
    .in('loan_id', ownIds).order('requested_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/investor/repayment-requests', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { loan_id, requested_amount, is_partial, reason } = req.body || {};
  if (!loan_id || requested_amount == null) return res.status(400).json({ error: 'loan_id and requested_amount required' });
  const { data: loan } = await supabase.from('loans').select('id, borrower_id').eq('id', loan_id).maybeSingle();
  if (!loan || loan.borrower_id !== req.user.borrowerId) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('repayment_requests').insert({
    loan_id, requested_amount: Number(requested_amount),
    is_partial: is_partial !== false, reason: reason || null, status: 'PENDING',
  }).select('*, loan:loans(id, reference, current_balance, project:projects(id, name))').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'REPAYMENT_REQUEST_CREATED', 'RepaymentRequest', data.id, { loan_id, requested_amount });
  res.status(201).json(data);
});

app.get('/api/investor/topup-requests', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { data: ownLoans } = await supabase.from('loans').select('id').eq('borrower_id', req.user.borrowerId);
  const ownIds = (ownLoans || []).map((l) => l.id);
  if (ownIds.length === 0) return res.json([]);
  const { data, error } = await supabase.from('topup_requests')
    .select('*, loan:loans(id, reference, current_balance, project:projects(id, name))')
    .in('loan_id', ownIds).order('requested_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/investor/topup-requests', requireAuth(['LENDER']), requireLenderWithBorrower, async (req, res) => {
  if (!dbReady(req, res)) return;
  const { loan_id, amount, notes } = req.body || {};
  if (!loan_id || amount == null) return res.status(400).json({ error: 'loan_id and amount required' });
  const { data: loan } = await supabase.from('loans').select('id, borrower_id').eq('id', loan_id).maybeSingle();
  if (!loan || loan.borrower_id !== req.user.borrowerId) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('topup_requests').insert({
    loan_id, amount: Number(amount), notes: notes || null, status: 'PENDING',
  }).select('*, loan:loans(id, reference, current_balance, project:projects(id, name))').single();
  if (error) return res.status(400).json({ error: error.message });
  await logAction(req, 'TOPUP_REQUEST_CREATED', 'TopUpRequest', data.id, { loan_id, amount });
  res.status(201).json(data);
});

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.WEBSITE_URL || 'https://ghanprojects.com.au';
  const today = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/services', priority: '0.9', changefreq: 'monthly' },
    { url: '/projects', priority: '0.8', changefreq: 'weekly' },
    { url: '/insights', priority: '0.9', changefreq: 'daily' },
    { url: '/invest', priority: '0.8', changefreq: 'weekly' },
    { url: '/resources', priority: '0.7', changefreq: 'monthly' },
    { url: '/resources/ai-assistant', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/rental-yield-calculator', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/stamp-duty-calculator', priority: '0.8', changefreq: 'monthly' },
    { url: '/resources/subdivision-checker', priority: '0.8', changefreq: 'monthly' },
    { url: '/book-consultation', priority: '0.8', changefreq: 'monthly' },
  ];
  
  let blogPosts = [];
  if (supabase) {
    try {
      const { data } = await supabase.from('blog_posts').select('id, date, updated_at').eq('published', true);
      blogPosts = data || [];
    } catch {}
  }
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${page.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }
  
  for (const post of blogPosts) {
    const lastmod = post.updated_at || post.date || today;
    xml += `  <url>\n    <loc>${baseUrl}/insights/${post.id}</loc>\n    <lastmod>${lastmod.split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  
  xml += `</urlset>`;
  
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

export default app;
