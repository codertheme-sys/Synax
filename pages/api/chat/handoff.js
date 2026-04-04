import { createServerClient } from '../../../lib/supabase';

async function requireUser(supabaseAdmin, token) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function checkAdmin(supabaseAdmin, userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return profile?.is_admin === true;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const token = authHeader.replace('Bearer ', '');
      const supabaseAdmin = createServerClient();
      const user = await requireUser(supabaseAdmin, token);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('chat_handoff_state')
        .select('human_handoff')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        if (error.message?.includes('chat_handoff_state') || error.code === '42P01') {
          return res.status(200).json({ success: true, humanHandoff: false });
        }
        console.error('handoff GET:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        humanHandoff: data?.human_handoff === true,
      });
    } catch (e) {
      console.error('handoff GET:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const user = await requireUser(supabaseAdmin, token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { humanHandoff, userId: targetUserId } = req.body || {};
    if (typeof humanHandoff !== 'boolean') {
      return res.status(400).json({ success: false, error: 'humanHandoff boolean required' });
    }

    const admin = await checkAdmin(supabaseAdmin, user.id);

    let subjectId = user.id;
    if (targetUserId && targetUserId !== user.id) {
      if (!admin) {
        return res.status(403).json({ success: false, error: 'Admin only' });
      }
      subjectId = targetUserId;
    } else if (!admin && humanHandoff === false) {
      return res.status(403).json({ success: false, error: 'Only admins can re-enable AI' });
    }

    const { error } = await supabaseAdmin.from('chat_handoff_state').upsert(
      {
        user_id: subjectId,
        human_handoff: humanHandoff,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      if (error.message?.includes('chat_handoff_state') || error.code === '42P01') {
        return res.status(503).json({
          success: false,
          error: 'chat_handoff_state missing. Run database-chat-ai-layered.sql in Supabase.',
        });
      }
      throw error;
    }

    return res.status(200).json({ success: true, humanHandoff });
  } catch (e) {
    console.error('handoff POST:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
