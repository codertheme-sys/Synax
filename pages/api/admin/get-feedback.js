// pages/api/admin/get-feedback.js
// API endpoint to get feedback with user information (admin only)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { status, type } = req.query;

    let query = supabaseAdmin
      .from('feedback')
      .select(`
        *,
        user:profiles!feedback_user_id_fkey (
          id,
          username,
          email
        ),
        responder:profiles!feedback_responded_by_fkey (
          id,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      feedback: data || []
    });

  } catch (error) {
    console.error('Error in get-feedback API:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch feedback'
    });
  }
}
