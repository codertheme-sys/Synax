import { createServerClient } from '../../../lib/supabase';
import { isBlockedEmail } from '../../../lib/blocked-users';
import { CHAT_AI_SYSTEM_PROMPT } from '../../../lib/chat-ai-system-prompt';

const HANDOFF_REGEX =
  /müşteri\s*temsilcisi|canlı\s*destek|insanla|operatör|yetkili|şikayet|canlı\s*temsilci|human\s*agent|live\s*agent|speak\s*to\s*(a\s*)?(person|human)|real\s*person|talk\s*to\s*(a\s*)?(human|agent)|representative|manager/i;

const MAX_CONTEXT_MESSAGES = 24;
const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

function buildOpenAIMessages(rows) {
  const chronological = [...rows].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const slice = chronological.slice(-MAX_CONTEXT_MESSAGES);
  const out = [{ role: 'system', content: CHAT_AI_SYSTEM_PROMPT }];
  for (const m of slice) {
    const text = (m.message || '').trim();
    if (!text && !m.attachment_url) continue;
    const body = m.attachment_url ? `${text || '[attachment]'}`.trim() : text;
    if (!body) continue;
    if (m.is_admin || m.is_ai) {
      out.push({ role: 'assistant', content: body });
    } else {
      out.push({ role: 'user', content: body });
    }
  }
  return out;
}

function parseAiJson(raw) {
  const trimmed = (raw || '').trim();
  let obj;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        obj = JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return { reply: trimmed || 'Thanks for your message. A team member will assist you shortly.', escalate: true };
      }
    } else {
      return { reply: trimmed || 'Thanks for your message.', escalate: false };
    }
  }
  const reply = typeof obj.reply === 'string' ? obj.reply : String(obj.reply || '');
  const escalate = obj.escalate === true;
  return { reply: reply.trim() || '…', escalate };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      skipped: true,
      reason: 'OPENAI_API_KEY not configured',
    });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (isBlockedEmail(user.email)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const userId = user.id;

    const { data: handoffRow, error: handoffErr } = await supabaseAdmin
      .from('chat_handoff_state')
      .select('human_handoff')
      .eq('user_id', userId)
      .maybeSingle();

    if (handoffErr && handoffErr.code !== 'PGRST116') {
      if (handoffErr.message?.includes('chat_handoff_state') || handoffErr.code === '42P01') {
        return res.status(503).json({
          success: false,
          error: 'Run database-chat-ai-layered.sql in Supabase (chat_handoff_state).',
        });
      }
      throw handoffErr;
    }

    if (handoffRow?.human_handoff === true) {
      return res.status(200).json({ success: true, skipped: true, reason: 'human_handoff' });
    }

    const { data: recent, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, message, is_admin, is_ai, created_at, attachment_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);

    if (msgError) throw msgError;
    const rows = [...(recent || [])].reverse();
    const last = rows[rows.length - 1];
    if (!last || last.is_admin || last.is_ai) {
      return res.status(200).json({ success: true, skipped: true, reason: 'no_user_message' });
    }

    const lastUserText = (last.message || '').trim();
    if (HANDOFF_REGEX.test(lastUserText)) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email, username')
        .eq('id', userId)
        .single();

      const { error: kwInsErr } = await supabaseAdmin.from('chat_messages').insert({
        user_id: userId,
        user_email: user.email || profile?.email,
        user_name: profile?.full_name || profile?.username || user.email?.split('@')[0],
        message:
          'Anladım — talebinizi canlı destek ekibimize ilettim. Bir temsilci müsait olduğunda size buradan yazacaktır. / I have routed your request to our live team; an agent will reply here shortly.',
        is_admin: false,
        is_ai: true,
        is_read: false,
      });
      if (kwInsErr) throw kwInsErr;

      await supabaseAdmin.from('chat_handoff_state').upsert(
        {
          user_id: userId,
          human_handoff: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      return res.status(200).json({
        success: true,
        handoff: true,
        keywordHandoff: true,
      });
    }

    const openaiMessages = buildOpenAIMessages(rows);

    const completionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: openaiMessages,
        temperature: 0.35,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    const completionJson = await completionRes.json().catch(() => ({}));
    if (!completionRes.ok) {
      console.error('OpenAI error:', completionRes.status, completionJson);
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: 'openai_error',
        detail: completionJson?.error?.message,
      });
    }

    const raw = completionJson?.choices?.[0]?.message?.content || '';
    const { reply, escalate } = parseAiJson(raw);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, username')
      .eq('id', userId)
      .single();

    const { error: insErr } = await supabaseAdmin.from('chat_messages').insert({
      user_id: userId,
      user_email: user.email || profile?.email,
      user_name: profile?.full_name || profile?.username || user.email?.split('@')[0],
      message: reply,
      is_admin: false,
      is_ai: true,
      is_read: false,
    });

    if (insErr) {
      if (insErr.message?.includes('is_ai') || insErr.code === '42703') {
        return res.status(503).json({
          success: false,
          error: 'Add is_ai column: run database-chat-ai-layered.sql',
        });
      }
      throw insErr;
    }

    if (escalate) {
      await supabaseAdmin.from('chat_handoff_state').upsert(
        {
          user_id: userId,
          human_handoff: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }

    return res.status(200).json({
      success: true,
      escalated: escalate,
    });
  } catch (e) {
    console.error('ai-reply:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
