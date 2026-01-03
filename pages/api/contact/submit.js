// pages/api/contact/submit.js - Contact Form Submission API
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, attachment_url, attachment_name, attachment_type } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }

    // Get Supabase client
    const supabase = createServerClient();

    // Insert contact message into database
    const insertData = {
      full_name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'new'
    };

    // Add attachment info if provided
    if (attachment_url) {
      insertData.attachment_url = attachment_url;
      insertData.attachment_name = attachment_name;
      insertData.attachment_type = attachment_type;
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact message:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to submit message. Please try again later.' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
      data: {
        id: data.id
      }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'An unexpected error occurred. Please try again later.' 
    });
  }
}

