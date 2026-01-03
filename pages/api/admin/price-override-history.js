// pages/api/admin/price-override-history.js - Fiyat Değişiklik Geçmişi
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseAdmin = createServerClient();

  // Authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
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

  try {
    const { asset_id, asset_type, limit = 100 } = req.query;

    let query = supabaseAdmin
      .from('price_override_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (asset_id) {
      query = query.eq('asset_id', asset_id);
    }

    if (asset_type) {
      query = query.eq('asset_type', asset_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get price override history error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

