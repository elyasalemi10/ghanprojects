import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
const app = express();

const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

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

app.use(cors());
app.use(express.json());

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Resources unlock
app.post('/api/resources/unlock', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const websiteUrl = process.env.WEBSITE_URL || 'https://pdcon.com.au';
    const verifiedLink = `${websiteUrl}/resources?verified=true`;
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Access Your Free Property Development Resources - PDCON',
      html: `<h2>Welcome to PDCON!</h2><p>Click below to access your resources:</p><a href="${verifiedLink}" style="background:#1a365d;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">Access Resources</a>`
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
        subject: 'Your Consultation Request - PDCON',
        html: `
          <h2>Thank you for your consultation request, ${userName}!</h2>
          <p>We've received your request and this is a <strong>tentative booking</strong>. One of our property specialists will review your details and get back to you within 1 business day to confirm a suitable time.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>We'll review your requirements</li>
            <li>A specialist will contact you to confirm the consultation</li>
            <li>We'll discuss whether a phone call or video meeting works best for you</li>
          </ul>
          <p>In the meantime, feel free to explore our <a href="https://pdcon.com.au/insights">latest insights</a> or <a href="https://pdcon.com.au/resources">free resources</a>.</p>
          <p>Best regards,<br>The PDCON Team</p>
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
        subject: 'Welcome to the PDCON Investor Network',
        html: `
          <h2>Welcome to the Investor Network${fullName ? `, ${fullName}` : ''}!</h2>
          <p>Thank you for joining the PDCON Investor Network. You're now part of an exclusive group of property investors and developers who receive priority access to opportunities.</p>
          <p><strong>What you'll receive:</strong></p>
          <ul>
            <li>First access to off-market development sites</li>
            <li>Strategic joint venture opportunities</li>
            <li>Monthly Melbourne property market insights</li>
            <li>Invitations to exclusive investor events</li>
          </ul>
          <p><strong>Free Resources:</strong></p>
          <p>As a member, you have access to our strategic resources including feasibility checklists, due diligence guides, and JV partnership frameworks. <a href="https://pdcon.com.au/resources">Access them here</a>.</p>
          <p>We'll be in touch when opportunities matching your interests become available. In the meantime, feel free to <a href="https://pdcon.com.au/book-consultation">book a consultation</a> to discuss your property goals.</p>
          <p>Best regards,<br>The PDCON Team</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">You're receiving this email because you signed up for the PDCON Investor Network. You can unsubscribe at any time by replying to this email.</p>
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
      subject: 'Welcome to PDCON Insights',
      html: `
        <h2>Welcome to PDCON Insights!</h2>
        <p>Thank you for subscribing to our newsletter. You'll now receive monthly strategic insights on Melbourne's property market.</p>
        <p><strong>What to expect:</strong></p>
        <ul>
          <li>Monthly market analysis and trends</li>
          <li>Development insights and case studies</li>
          <li>Investment strategy tips</li>
          <li>Early access to new resources and guides</li>
        </ul>
        <p>In the meantime, explore our <a href="https://pdcon.com.au/resources">free resources</a> or <a href="https://pdcon.com.au/book-consultation">book a consultation</a> to discuss your property goals.</p>
        <p>Best regards,<br>The PDCON Team</p>
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
app.get('/api/admin/posts', async (req, res) => {
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
app.post('/api/admin/posts', async (req, res) => {
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
app.put('/api/admin/posts/:id', async (req, res) => {
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
app.delete('/api/admin/posts/:id', async (req, res) => {
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
app.get('/api/admin/signups', async (req, res) => {
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
app.post('/api/admin/send-email', async (req, res) => {
  const { senderName, senderPrefix, recipientEmail, subject, body, isHtml } = req.body;
  const fromEmail = `${senderName} <${senderPrefix}@pdcon.com.au>`;
  
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

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.WEBSITE_URL || 'https://pdcon.com.au';
  const today = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/services', priority: '0.9', changefreq: 'monthly' },
    { url: '/projects', priority: '0.8', changefreq: 'weekly' },
    { url: '/insights', priority: '0.9', changefreq: 'daily' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
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
