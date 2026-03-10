// pages/api/admin/chat-messages.js - Admin chat messages for a user (bypasses RLS)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.query;
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

    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: messages || [],
    });
  } catch (error) {
    console.error('Admin chat-messages API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
