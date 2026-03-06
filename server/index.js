import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Consultation Request: ${fullName}`,
      html: `
        <h2>New Consultation Request</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Budget Range:</strong> ${budgetRange}</p>
        <p><strong>Interest Type:</strong> ${interestType}</p>
        <p><strong>Preferred Time:</strong> ${preferredTime}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    // Save to Supabase
    await saveEmailSignup(email, 'consultation');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Investor network signup
app.post('/api/investor-network', async (req, res) => {
  const { fullName, email, phone, budgetRange, interestType } = req.body;
  
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: process.env.RESEND_TO_EMAIL,
      subject: `New Investor Network Signup: ${fullName}`,
      html: `
        <h2>New Investor Network Signup</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Budget Range:</strong> ${budgetRange}</p>
        <p><strong>Interest Type:</strong> ${interestType}</p>
      `
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(500).json({ error: 'Failed to send email', details: result.error.message });
    }
    
    // Save to Supabase
    await saveEmailSignup(email, 'investor_network');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
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
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/resources', priority: '0.7', changefreq: 'monthly' },
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
