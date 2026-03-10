// pages/api/admin/chat-conversations.js - Admin chat conversations (bypasses RLS)
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

    const { data: allMessages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('user_id, user_email, user_name, created_at, is_read, is_admin')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userMap = new Map();
    const unreadMap = {};

    (allMessages || []).forEach((msg) => {
      if (msg.is_admin) return;

      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          user_email: msg.user_email,
          user_name: msg.user_name,
          last_message: msg,
          last_message_time: msg.created_at,
        });
        unreadMap[msg.user_id] = 0;
      }

      if (!msg.is_read && !msg.is_admin) {
        unreadMap[msg.user_id] = (unreadMap[msg.user_id] || 0) + 1;
      }
    });

    const conversations = Array.from(userMap.values()).sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    return res.status(200).json({
      success: true,
      data: { conversations, unreadCounts: unreadMap },
    });
  } catch (error) {
    console.error('Admin chat-conversations API error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
