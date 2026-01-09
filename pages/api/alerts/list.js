// pages/api/alerts/list.js - List User Alerts
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { status } = req.query;

    let query = supabaseAdmin
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: alerts, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching alerts:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    return res.status(200).json({
      success: true,
      data: alerts || []
    });

  } catch (error) {
    console.error('List alerts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts'
    });
  }
}









