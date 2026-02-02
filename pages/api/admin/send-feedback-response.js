// pages/api/admin/send-feedback-response.js
// API endpoint to send feedback response email
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { feedbackId, responseText, userEmail, userName, subject, message, feedbackType } = req.body;

    if (!feedbackId || !responseText || !userEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: feedbackId, responseText, userEmail' 
      });
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get feedback to verify it exists
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .select('*, user:profiles!feedback_user_id_fkey(id, username, email)')
      .eq('id', feedbackId)
      .single();

    if (feedbackError || !feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Get user email from feedback if not provided
    const recipientEmail = userEmail || feedback.user?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'User email not found' });
    }

    // Import email template
    const { getFeedbackResponseTemplate } = await import('../../../lib/email-templates-feedback');
    const displayName = userName || feedback.user?.username || recipientEmail.split('@')[0] || 'User';
    const emailHtml = getFeedbackResponseTemplate(
      displayName,
      subject || feedback.subject,
      message || feedback.message,
      responseText,
      feedbackType || feedback.type
    );

    const emailSubject = `Response to Your ${feedback.type === 'complaint' ? 'Complaint' : feedback.type === 'suggestion' ? 'Suggestion' : 'Feedback'} - Synax`;

    // Send email using nodemailer (same as send-contact-reply.js)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || 'support@synax.vip';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      console.error('SMTP not configured');
      return res.status(500).json({ 
        error: 'SMTP not configured',
        warning: 'Email could not be sent. Please configure SMTP settings.'
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"Synax Support" <${smtpFrom}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
        replyTo: smtpFrom,
      });

      console.log(`✅ Feedback response email sent to ${recipientEmail}`);

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        email: recipientEmail
      });

    } catch (nodemailerError) {
      console.error('Nodemailer Error:', nodemailerError);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: nodemailerError.message 
      });
    }

  } catch (error) {
    console.error('Error sending feedback response email:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email'
    });
  }
}
