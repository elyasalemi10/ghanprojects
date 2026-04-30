import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: log env vars on startup
console.log('Environment loaded:');
console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set (starts with ' + process.env.RESEND_API_KEY.substring(0, 6) + '...)' : 'NOT SET');
console.log('- RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'NOT SET');
console.log('- RESEND_TO_EMAIL:', process.env.RESEND_TO_EMAIL || 'NOT SET');
console.log('- ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'NOT SET');
console.log('- WEBSITE_URL:', process.env.WEBSITE_URL || 'NOT SET');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'NOT SET');

const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase client
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Helper function to save email signup to Supabase
async function saveEmailSignup(email, source) {
  if (!supabase) {
    console.log('Supabase not configured, skipping email save');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('email_signups')
      .insert([{ email, source, created_at: new Date().toISOString() }])
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return null;
    }
    
    console.log('Email saved to Supabase:', data);
    return data;
  } catch (err) {
    console.error('Supabase error:', err);
    return null;
  }
}

app.use(cors());
app.use(express.json());

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Verify admin credentials
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Send resource unlock email
app.post('/api/resources/unlock', async (req, res) => {
  const { email } = req.body;
  
  console.log('Resource unlock request for:', email);
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const resourcesUrl = `${process.env.WEBSITE_URL || 'http://localhost:3000'}/resources?verified=true`;
    
    console.log('Sending email to:', email);
    console.log('From:', process.env.RESEND_FROM_EMAIL);
    console.log('Resources URL:', resourcesUrl);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Your Ghan Projects Resources Access',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #002B49;">Welcome to Ghan Projects</h1>
          <p>Thank you for your interest in our strategic property resources.</p>
          <p>Click the button below to access all premium resources:</p>
          <a href="${resourcesUrl}" style="display: inline-block; background-color: #C5A059; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; margin: 20px 0;">Access Resources</a>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link: ${resourcesUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">Ghan Projects | Melbourne Property Advisory</p>
        </div>
      `
    });
    
    console.log('Email sent result:', result);
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    // Save to Supabase
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

    // Also notify admin
    const adminResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: 'New Resource Download Request',
      html: `<p>New resource access request from: <strong>${email}</strong></p>`
    });
    
    console.log('Admin notification result:', adminResult);

    res.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, projectType, budget, message } = req.body;
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Contact Form: ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    // Save to Supabase
    await saveEmailSignup(email, 'contact');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Consultation booking
app.post('/api/consultation', async (req, res) => {
  const { fullName, email, phone, budgetRange, interestType, preferredTime, message } = req.body;
  
  try {
    // Send notification to admin
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Consultation Request: ${fullName}`,
      html: `
        <h2>New Consultation Request</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Budget Range:</strong> ${budgetRange}</p>
        <p><strong>Interest Type:</strong> ${interestType}</p>
        <p><strong>Preferred Time:</strong> ${preferredTime}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'None'}</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    // Send confirmation email to user
    if (email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'Your Consultation Request - Ghan Projects',
        html: `
          <h2>Thank you for your consultation request, ${fullName}!</h2>
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
    
    // Save to Supabase
    await saveEmailSignup(email || phone, 'consultation');
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `CONSULTATION REQUEST\n\nName: ${fullName}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nBudget: ${budgetRange || 'N/A'}\nInterest: ${interestType || 'N/A'}\nPreferred Time: ${preferredTime || 'N/A'}${message ? `\nMessage: ${message}` : ''}`
        })
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Investor network signup
app.post('/api/investor-network', async (req, res) => {
  const { fullName, email, phone, budgetRange, interestType } = req.body;
  
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone required' });
  }
  
  try {
    // Send notification to admin
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Investor Network Signup: ${fullName || 'Anonymous'}`,
      html: `
        <h2>New Investor Network Signup</h2>
        <p><strong>Name:</strong> ${fullName || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Budget Range:</strong> ${budgetRange || 'Not specified'}</p>
        <p><strong>Interest Type:</strong> ${interestType || 'Not specified'}</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
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
    
    // Save to Supabase
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
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
  const { email, source } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Save to Supabase
    await saveEmailSignup(email, source || 'newsletter');
    
    // Send welcome email
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
    
    // Send Telegram notification
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
  } catch (error) {
    console.error('Newsletter signup error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Admin send custom email
app.post('/api/admin/send-email', upload.array('attachments', 10), async (req, res) => {
  const { senderName, senderPrefix, recipientEmail, subject, body, isHtml } = req.body;
  
  const fromEmail = `${senderName} <${senderPrefix}@ghanprojects.com.au>`;
  
  console.log('Admin email request:');
  console.log('- From:', fromEmail);
  console.log('- To:', recipientEmail);
  console.log('- Subject:', subject);
  console.log('- Is HTML:', isHtml);
  console.log('- Attachments:', req.files?.length || 0);
  
  try {
    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) || [];

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: isHtml === 'true' ? body : `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</pre>`,
      attachments
    });
    
    console.log('Admin email result:', result);
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    res.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('Admin email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// ============================================
// BLOG POSTS API
// ============================================

// Get all blog posts (public)
app.get('/api/posts', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get all blog posts (admin - includes drafts)
app.get('/api/admin/posts', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single blog post
app.get('/api/posts/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create blog post
app.post('/api/admin/posts', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  const { title, category, thumbnail, date, read_time, content, excerpt, published } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title,
        category,
        thumbnail,
        date,
        read_time,
        content,
        excerpt,
        published: published || false,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    res.json({ success: true, post: data[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update blog post
app.put('/api/admin/posts/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  const { title, category, thumbnail, date, read_time, content, excerpt, published } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title,
        category,
        thumbnail,
        date,
        read_time,
        content,
        excerpt,
        published,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json({ success: true, post: data[0] });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete blog post
app.delete('/api/admin/posts/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ============================================
// MEMBERS/SIGNUPS API
// ============================================

// Get all email signups
app.get('/api/admin/signups', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('email_signups')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching signups:', error);
    res.status(500).json({ error: 'Failed to fetch signups' });
  }
});

// Delete signup
app.delete('/api/admin/signups/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  try {
    const { error } = await supabase
      .from('email_signups')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting signup:', error);
    res.status(500).json({ error: 'Failed to delete signup' });
  }
});

// Upload image for blog
app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const fileName = `blog/${Date.now()}-${req.file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    res.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ============================================
// SITEMAP GENERATION
// ============================================

// ============================================
// CHATBOT WITH TOOLS (GPT-4o-mini)
// ============================================

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Melbourne timezone helper
const getMelbourneTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
};

// Check if date is within 48 hours
const isWithin48Hours = (dateStr) => {
  const now = getMelbourneTime();
  const targetDate = new Date(dateStr);
  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 48;
};

// Format date for Cal.com API (YYYY-MM-DD)
const formatDateForCal = (date) => {
  return date.toISOString().split('T')[0];
};

// Tool: Check availability via Cal.com
async function checkAvailability(date) {
  // Validate date is not within 48 hours
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
    
    // Use Cal.com v2 API for slots
    const url = `https://api.cal.com/v2/slots/available?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&eventTypeId=${process.env.CAL_COM_EVENT_TYPE_ID}`;
    console.log('[Chatbot] Cal.com slots URL:', url);
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'cal-api-version': '2024-08-13',
        'Authorization': `Bearer ${process.env.CAL_COM_API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('[Chatbot] Cal.com response:', JSON.stringify(data, null, 2));
    
    if (!response.ok || data.status === 'error') {
      console.error('Cal.com API error:', data);
      return { error: true, message: "Unable to check availability at this time." };
    }
    
    // Filter slots to only 10am-4pm Melbourne time
    const availableSlots = [];
    const slots = data.data?.slots || data.slots || {};
    const dateKey = Object.keys(slots)[0];
    const slotsForDate = dateKey ? slots[dateKey] : [];
    
    for (const slot of slotsForDate) {
      const slotTime = new Date(slot.time);
      const melbourneHour = parseInt(slotTime.toLocaleString('en-AU', { 
        timeZone: 'Australia/Melbourne', 
        hour: '2-digit', 
        hour12: false 
      }));
      
      if (melbourneHour >= 10 && melbourneHour < 16) {
        availableSlots.push({
          time: slotTime.toLocaleString('en-AU', { 
            timeZone: 'Australia/Melbourne', 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          hour: melbourneHour,
          minute: parseInt(slotTime.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', minute: '2-digit' })),
          isoTime: slot.time
        });
      }
    }
    
    const formattedDate = new Date(date).toLocaleDateString('en-AU', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    if (availableSlots.length === 0) {
      return { 
        available: false, 
        date: dateObj.toISOString().split('T')[0],
        message: `No available slots on ${formattedDate} between 10am-4pm. Please try another date.`
      };
    }
    
    // Group consecutive slots into time ranges
    const formatHour = (h) => {
      if (h === 12) return '12pm';
      if (h > 12) return `${h - 12}pm`;
      return `${h}am`;
    };
    
    const ranges = [];
    let rangeStart = availableSlots[0];
    let prevSlot = availableSlots[0];
    
    for (let i = 1; i < availableSlots.length; i++) {
      const curr = availableSlots[i];
      const prevMinutes = prevSlot.hour * 60 + prevSlot.minute;
      const currMinutes = curr.hour * 60 + curr.minute;
      
      // If gap is more than 15 minutes, start new range
      if (currMinutes - prevMinutes > 15) {
        ranges.push({
          start: rangeStart,
          end: prevSlot
        });
        rangeStart = curr;
      }
      prevSlot = curr;
    }
    // Push last range
    ranges.push({ start: rangeStart, end: prevSlot });
    
    // Format ranges as readable text with ISO times for booking
    const rangeDescriptions = ranges.map(r => {
      const startHour = formatHour(r.start.hour);
      // End time should be 15 mins after last slot starts (since it's a 15 min meeting)
      const endMinutes = r.end.hour * 60 + r.end.minute + 15;
      const endHour = Math.floor(endMinutes / 60);
      const endFormatted = formatHour(endHour);
      
      if (startHour === endFormatted || r.start === r.end) {
        return `${r.start.time} (ISO: ${r.start.isoTime})`;
      }
      return `${startHour} to ${endFormatted}`;
    });
    
    // Also provide specific slot options for booking
    const slotOptions = availableSlots.slice(0, 6).map(s => `${s.time} (ISO: ${s.isoTime})`);
    
    return {
      available: true,
      date: dateObj.toISOString().split('T')[0],
      slots: availableSlots,
      message: `Available on ${formattedDate}: ${rangeDescriptions.join(', ')}. Specific slots the user can book: ${slotOptions.join(', ')}. Use the ISO time when booking.`
    };
  } catch (error) {
    console.error('Check availability error:', error);
    return { error: true, message: "Unable to check availability at this time." };
  }
}

// Tool: Book meeting via Cal.com
async function bookMeeting(name, email, phone, dateTime) {
  // Validate date is not within 48 hours
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
    // Use Cal.com v2 API for bookings
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
    
    console.log('[Chatbot] Booking data:', JSON.stringify(bookingData, null, 2));
    
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
    console.log('[Chatbot] Booking response:', JSON.stringify(result, null, 2));
    
    if (!response.ok || result.status === 'error') {
      console.error('Cal.com booking error:', result);
      return { error: true, message: "Unable to complete booking. The slot may no longer be available." };
    }
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const bookingTime = new Date(dateTime).toLocaleString('en-AU', { 
        timeZone: 'Australia/Melbourne',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const telegramMessage = `CHATBOT BOOKING\n\nName: ${name}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nTime: ${bookingTime}`;
      
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'HTML'
        })
      });
    }
    
    const confirmedTime = new Date(dateTime).toLocaleString('en-AU', { 
      timeZone: 'Australia/Melbourne',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return {
      success: true,
      message: `Booking confirmed for ${name} on ${confirmedTime}. Our team will be in touch shortly to confirm if you prefer a phone call or Google Meet.`
    };
  } catch (error) {
    console.error('Book meeting error:', error);
    return { error: true, message: "Unable to complete booking at this time." };
  }
}

// Tool: Send inquiry via Resend
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
      html: `
        <h2>New Inquiry from Website Chatbot</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">This inquiry was submitted via the website chatbot.</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return { error: true, message: "Unable to send inquiry at this time." };
    }
    
    // Save to Supabase
    await saveEmailSignup(email || phone, 'chatbot_inquiry');
    
    // Send Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const telegramMessage = `CHATBOT INQUIRY\n\nName: ${name}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nBudget: ${budget}${message ? `\nMessage: ${message}` : ''}`;
      
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramMessage
        })
      });
    }
    
    return {
      success: true,
      message: `Thank you ${name}! Your inquiry has been submitted. Our team will be in touch within 24 hours.`
    };
  } catch (error) {
    console.error('Send inquiry error:', error);
    return { error: true, message: "Unable to send inquiry at this time." };
  }
}

// Define tools for GPT-4o-mini
const chatTools = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check available consultation times on a specific date. Only use for dates at least 48 hours from now. Returns available time slots between 10am-4pm Melbourne time.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check availability for in YYYY-MM-DD format (e.g., 2024-03-15)"
          }
        },
        required: ["date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_meeting",
      description: "Book a consultation meeting at a specific time that was previously confirmed as available via check_availability. Use the exact isoTime from the availability check. Requires the user's name and either email or phone number.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The user's full name"
          },
          email: {
            type: "string",
            description: "The user's email address (optional if phone provided)"
          },
          phone: {
            type: "string",
            description: "The user's phone number (optional if email provided)"
          },
          dateTime: {
            type: "string",
            description: "The exact ISO 8601 UTC datetime from the availability check isoTime field (e.g., 2026-03-11T23:00:00.000Z for 10am Melbourne time)"
          }
        },
        required: ["name", "dateTime"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_inquiry",
      description: "Send a general inquiry to the Ghan Projects team. Use this when the user wants to ask questions, get more information, or isn't ready to book yet. Collects name, contact info, budget, and optional message.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The user's full name"
          },
          email: {
            type: "string",
            description: "The user's email address (optional if phone provided)"
          },
          phone: {
            type: "string",
            description: "The user's phone number (optional if email provided)"
          },
          budget: {
            type: "string",
            description: "The user's budget range or investment amount they're considering"
          },
          message: {
            type: "string",
            description: "Optional message or note from the user to pass to the team"
          }
        },
        required: ["name", "budget"]
      }
    }
  }
];

// Generate system prompt with current date/time
const getSystemPrompt = () => {
  const now = getMelbourneTime();
  const currentDate = now.toLocaleDateString('en-AU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'Australia/Melbourne'
  });
  const currentTime = now.toLocaleTimeString('en-AU', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Australia/Melbourne'
  });
  
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

// Chat endpoint
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
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      tools: chatTools,
      tool_choice: 'auto',
      max_tokens: 500
    });
    
    const assistantMessage = response.choices[0].message;
    
    // Check if the model wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      const firstToolUsed = assistantMessage.tool_calls[0].function.name;
      
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let result;
        
        console.log(`[Chatbot] Executing tool: ${toolCall.function.name}`, args);
        
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
        
        console.log(`[Chatbot] Tool result:`, result);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result)
        });
      }
      
      // Get final response after tool execution
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          assistantMessage,
          ...toolResults
        ],
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
// SITEMAP GENERATION
// ============================================

app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.WEBSITE_URL || 'https://ghanprojects.com.au';
  const today = new Date().toISOString().split('T')[0];
  
  // Static pages with priority and change frequency
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
  
  // Fetch blog posts from database
  let blogPosts = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, date, updated_at')
        .eq('published', true);
      blogPosts = data || [];
    } catch (error) {
      console.error('Error fetching posts for sitemap:', error);
    }
  }
  
  // Generate XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }
  
  // Add blog posts
  for (const post of blogPosts) {
    const lastmod = post.updated_at || post.date || today;
    xml += `  <url>
    <loc>${baseUrl}/insights/${post.id}</loc>
    <lastmod>${lastmod.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }
  
  xml += `</urlset>`;
  
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
