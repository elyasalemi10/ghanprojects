import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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
