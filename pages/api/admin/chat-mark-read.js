// pages/api/admin/chat-mark-read.js - Mark user messages as read (bypasses RLS)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_admin', false);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Admin chat-mark-read API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
