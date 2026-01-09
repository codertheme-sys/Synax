// pages/api/admin/send-contact-reply.js - Send email reply to user
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { messageId, replyMessage, userEmail, userName, subject } = req.body;

    if (!messageId || !replyMessage || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email içeriği
    const emailSubject = `Re: ${subject || 'Your Contact Request'}`;
    const emailBodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .reply-box { background: white; padding: 16px; border-left: 4px solid #3b82f6; margin: 16px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Synax Support Team</h2>
    </div>
    <div class="content">
      <p>Hello ${userName || 'Valued Customer'},</p>
      <p>Thank you for contacting us. We have received your message and here is our response:</p>
      <div class="reply-box">
        ${replyMessage.replace(/\n/g, '<br>')}
      </div>
      <p>If you have any further questions, please don't hesitate to contact us again.</p>
      <p>Best regards,<br>Synax Support Team</p>
      <div class="footer">
        <p>This is an automated response. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const emailBodyText = `
Hello ${userName || 'Valued Customer'},

Thank you for contacting us. We have received your message and here is our response:

---
${replyMessage}
---

If you have any further questions, please don't hesitate to contact us again.

Best regards,
Synax Support Team

---
This is an automated response. Please do not reply to this email.
    `.trim();

    // Try to send email using Supabase's SMTP settings or fallback to nodemailer
    // First, check if SMTP is configured in environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || 'support@synax.vip';

    // Debug: Log SMTP configuration (without password)
    console.log('=== SMTP Configuration Check ===');
    console.log('SMTP_HOST:', smtpHost ? '✓ Set' : '✗ Missing');
    console.log('SMTP_PORT:', smtpPort || '✗ Missing');
    console.log('SMTP_USER:', smtpUser || '✗ Missing');
    console.log('SMTP_PASSWORD:', smtpPassword ? '✓ Set (hidden)' : '✗ Missing');
    console.log('SMTP_FROM:', smtpFrom);
    console.log('User Email:', userEmail);
    console.log('===============================');

    let emailSent = false;
    let emailError = null;
    let errorDetails = null;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      // Use nodemailer if SMTP credentials are configured
      try {
        const nodemailer = require('nodemailer');
        
        const isSecure = smtpPort === '465';
        console.log(`Creating transporter with secure=${isSecure}, port=${smtpPort}`);
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          tls: {
            // Outlook/Hotmail için önerilen TLS ayarları
            ciphers: 'SSLv3',
            rejectUnauthorized: false, // Self-signed sertifikalar için
          },
          debug: true, // Enable debug output
          logger: true, // Log to console
        });

        // Test connection first
        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('✓ SMTP connection verified successfully');

        const mailOptions = {
          from: `"Synax Support" <${smtpFrom}>`,
          to: userEmail,
          subject: emailSubject,
          text: emailBodyText,
          html: emailBodyHTML,
          replyTo: smtpFrom,
        };

        console.log('Sending email...');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        emailSent = true;
      } catch (nodemailerError) {
        console.error('✗ Nodemailer Error Details:');
        console.error('Error Code:', nodemailerError.code);
        console.error('Error Command:', nodemailerError.command);
        console.error('Error Message:', nodemailerError.message);
        console.error('Full Error:', JSON.stringify(nodemailerError, null, 2));
        if (nodemailerError.response) {
          console.error('SMTP Response:', nodemailerError.response);
        }
        if (nodemailerError.responseCode) {
          console.error('SMTP Response Code:', nodemailerError.responseCode);
        }
        emailError = nodemailerError.message;
        errorDetails = {
          code: nodemailerError.code,
          command: nodemailerError.command,
          response: nodemailerError.response,
          responseCode: nodemailerError.responseCode,
        };
      }
    } else {
      // If SMTP not configured, log what's missing
      const missing = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpPort) missing.push('SMTP_PORT');
      if (!smtpUser) missing.push('SMTP_USER');
      if (!smtpPassword) missing.push('SMTP_PASSWORD');
      
      console.error('✗ SMTP not fully configured. Missing:', missing.join(', '));
      console.log('Email content that would be sent:');
      console.log('To:', userEmail);
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBodyText);
      emailError = `SMTP not configured. Missing: ${missing.join(', ')}`;
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: 'Reply saved and email sent successfully'
      });
    } else {
      // Even if email fails, the reply is saved in database
      return res.status(200).json({
        success: true,
        message: 'Reply saved successfully',
        warning: emailError || 'Email could not be sent. Please configure SMTP settings.',
        errorDetails: errorDetails || null,
        note: 'To enable email sending, add SMTP credentials to .env.local file'
      });
    }

  } catch (error) {
    console.error('Send contact reply error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { messageId, replyMessage, userEmail, userName, subject } = req.body;

    if (!messageId || !replyMessage || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email içeriği
    const emailSubject = `Re: ${subject || 'Your Contact Request'}`;
    const emailBodyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .reply-box { background: white; padding: 16px; border-left: 4px solid #3b82f6; margin: 16px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Synax Support Team</h2>
    </div>
    <div class="content">
      <p>Hello ${userName || 'Valued Customer'},</p>
      <p>Thank you for contacting us. We have received your message and here is our response:</p>
      <div class="reply-box">
        ${replyMessage.replace(/\n/g, '<br>')}
      </div>
      <p>If you have any further questions, please don't hesitate to contact us again.</p>
      <p>Best regards,<br>Synax Support Team</p>
      <div class="footer">
        <p>This is an automated response. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const emailBodyText = `
Hello ${userName || 'Valued Customer'},

Thank you for contacting us. We have received your message and here is our response:

---
${replyMessage}
---

If you have any further questions, please don't hesitate to contact us again.

Best regards,
Synax Support Team

---
This is an automated response. Please do not reply to this email.
    `.trim();

    // Try to send email using Supabase's SMTP settings or fallback to nodemailer
    // First, check if SMTP is configured in environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || 'support@synax.vip';

    // Debug: Log SMTP configuration (without password)
    console.log('=== SMTP Configuration Check ===');
    console.log('SMTP_HOST:', smtpHost ? '✓ Set' : '✗ Missing');
    console.log('SMTP_PORT:', smtpPort || '✗ Missing');
    console.log('SMTP_USER:', smtpUser || '✗ Missing');
    console.log('SMTP_PASSWORD:', smtpPassword ? '✓ Set (hidden)' : '✗ Missing');
    console.log('SMTP_FROM:', smtpFrom);
    console.log('User Email:', userEmail);
    console.log('===============================');

    let emailSent = false;
    let emailError = null;
    let errorDetails = null;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      // Use nodemailer if SMTP credentials are configured
      try {
        const nodemailer = require('nodemailer');
        
        const isSecure = smtpPort === '465';
        console.log(`Creating transporter with secure=${isSecure}, port=${smtpPort}`);
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: isSecure, // true for 465 (SSL), false for 587 (TLS)
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
          tls: {
            // Outlook/Hotmail için önerilen TLS ayarları
            ciphers: 'SSLv3',
            rejectUnauthorized: false, // Self-signed sertifikalar için
          },
          debug: true, // Enable debug output
          logger: true, // Log to console
        });

        // Test connection first
        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('✓ SMTP connection verified successfully');

        const mailOptions = {
          from: `"Synax Support" <${smtpFrom}>`,
          to: userEmail,
          subject: emailSubject,
          text: emailBodyText,
          html: emailBodyHTML,
          replyTo: smtpFrom,
        };

        console.log('Sending email...');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        emailSent = true;
      } catch (nodemailerError) {
        console.error('✗ Nodemailer Error Details:');
        console.error('Error Code:', nodemailerError.code);
        console.error('Error Command:', nodemailerError.command);
        console.error('Error Message:', nodemailerError.message);
        console.error('Full Error:', JSON.stringify(nodemailerError, null, 2));
        if (nodemailerError.response) {
          console.error('SMTP Response:', nodemailerError.response);
        }
        if (nodemailerError.responseCode) {
          console.error('SMTP Response Code:', nodemailerError.responseCode);
        }
        emailError = nodemailerError.message;
        errorDetails = {
          code: nodemailerError.code,
          command: nodemailerError.command,
          response: nodemailerError.response,
          responseCode: nodemailerError.responseCode,
        };
      }
    } else {
      // If SMTP not configured, log what's missing
      const missing = [];
      if (!smtpHost) missing.push('SMTP_HOST');
      if (!smtpPort) missing.push('SMTP_PORT');
      if (!smtpUser) missing.push('SMTP_USER');
      if (!smtpPassword) missing.push('SMTP_PASSWORD');
      
      console.error('✗ SMTP not fully configured. Missing:', missing.join(', '));
      console.log('Email content that would be sent:');
      console.log('To:', userEmail);
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBodyText);
      emailError = `SMTP not configured. Missing: ${missing.join(', ')}`;
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: 'Reply saved and email sent successfully'
      });
    } else {
      // Even if email fails, the reply is saved in database
      return res.status(200).json({
        success: true,
        message: 'Reply saved successfully',
        warning: emailError || 'Email could not be sent. Please configure SMTP settings.',
        errorDetails: errorDetails || null,
        note: 'To enable email sending, add SMTP credentials to .env.local file'
      });
    }

  } catch (error) {
    console.error('Send contact reply error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}

