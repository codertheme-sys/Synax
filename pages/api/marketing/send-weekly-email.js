// pages/api/marketing/send-weekly-email.js - Weekly marketing email system
import { createServerClient } from '../../../lib/supabase';
import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'support@synax.vip',
    pass: process.env.SMTP_PASS || '',
  },
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for admin authentication or cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = req.headers['x-cron-secret'] || req.body.cron_secret;
  
  if (!authHeader && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseAdmin = createServerClient();
    
    // Get all active users (email confirmed)
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    const activeUsers = users.users.filter(user => user.email_confirmed_at);
    
    // Get last email sent date from a tracking table (or use profiles)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, last_marketing_email_sent')
      .in('id', activeUsers.map(u => u.id));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter users who haven't received email in the last week
    const usersToEmail = profiles?.filter(profile => {
      if (!profile.last_marketing_email_sent) return true;
      const lastSent = new Date(profile.last_marketing_email_sent);
      return lastSent < oneWeekAgo;
    }) || [];

    let successCount = 0;
    let errorCount = 0;

    // Marketing email content
    const emailSubject = 'Weekly Update from Synax - New Features & Opportunities';
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Update from Synax</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                    <img src="https://synax.vip/images/logo.png" alt="Synax" style="max-width: 120px; height: auto; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Weekly Update from Synax</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Hello from Synax!</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We're excited to share the latest updates and new features on our platform!
                    </p>
                    
                    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                      <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; font-weight: 600;">✨ What's New</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                        <li>Enhanced trading experience with improved UI</li>
                        <li>New asset management features</li>
                        <li>Faster transaction processing</li>
                        <li>Improved security measures</li>
                      </ul>
                    </div>
                    
                    <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Don't miss out on the opportunities to grow your portfolio. Start trading today and take advantage of our competitive rates and secure platform.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="https://synax.vip/trade" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                        Start Trading Now
                      </a>
                    </div>
                    
                    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                      Thank you for being part of the Synax community. If you have any questions, feel free to reach out to our support team.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      © ${new Date().getFullYear()} Synax. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      <a href="https://synax.vip/contact" style="color: #3b82f6; text-decoration: none;">Contact Support</a> | 
                      <a href="https://synax.vip/terms" style="color: #3b82f6; text-decoration: none;">Terms of Use</a> | 
                      <a href="https://synax.vip/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send emails to eligible users
    for (const profile of usersToEmail) {
      try {
        const userEmail = activeUsers.find(u => u.id === profile.id)?.email || profile.email;
        if (!userEmail) continue;

        await transporter.sendMail({
          from: `"Synax Platform" <${SMTP_CONFIG.auth.user}>`,
          to: userEmail,
          subject: emailSubject,
          html: emailHtml,
        });

        // Update last_marketing_email_sent timestamp
        await supabaseAdmin
          .from('profiles')
          .update({ last_marketing_email_sent: now.toISOString() })
          .eq('id', profile.id);

        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.id}:`, emailError);
        errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Weekly marketing emails sent`,
      stats: {
        total: usersToEmail.length,
        success: successCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error('Weekly marketing email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send weekly marketing emails',
    });
  }
}













