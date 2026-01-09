// pages/api/admin/contact-message-update.js - Update contact message (reply, status change)
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

    const { messageId, status, adminNotes } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
      }
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .update(updateData)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact message:', error);
      return res.status(500).json({ error: 'Failed to update message' });
    }

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Contact message update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

