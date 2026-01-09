// pages/api/admin/price-override.js - Admin Manuel Fiyat Müdahalesi
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
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

  // GET - Tüm price overrides'ı getir
  if (req.method === 'GET') {
    try {
      const { active_only } = req.query;
      
      let query = supabaseAdmin
        .from('price_overrides')
        .select('*')
        .order('created_at', { ascending: false });

      if (active_only === 'true') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Get price overrides error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST - Create or update new price override
  if (req.method === 'POST') {
    try {
      const {
        asset_type,
        asset_symbol,
        manual_price,
        manual_price_change_24h = 0,
        manual_price_change_percent_24h = 0,
        is_active = true,
        source = 'manual',
        notes
      } = req.body;

      if (!asset_type || !asset_symbol || !manual_price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // asset_id ve asset_name'i asset_symbol'den türet (opsiyonel, veritabanı için)
      const asset_id = asset_symbol.toLowerCase();
      const asset_name = asset_symbol;

      // Mevcut override'ı kontrol et
      const { data: existing } = await supabaseAdmin
        .from('price_overrides')
        .select('*')
        .eq('asset_symbol', asset_symbol)
        .eq('asset_type', asset_type)
        .single();

      let result;
      if (existing) {
        // Update
        const { data, error } = await supabaseAdmin
          .from('price_overrides')
          .update({
            manual_price: parseFloat(manual_price),
            manual_price_change_24h: parseFloat(manual_price_change_24h),
            manual_price_change_percent_24h: parseFloat(manual_price_change_percent_24h),
            is_active: is_active,
            source: source,
            notes: notes,
            created_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('price_overrides')
          .insert({
            asset_type,
            asset_id,
            asset_symbol,
            asset_name,
            manual_price: parseFloat(manual_price),
            manual_price_change_24h: parseFloat(manual_price_change_24h),
            manual_price_change_percent_24h: parseFloat(manual_price_change_percent_24h),
            is_active: is_active,
            source: source,
            notes: notes,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Also update price history (use manual override if exists)
      await supabaseAdmin
        .from('price_history')
        .upsert({
          asset_type,
          asset_id,
          asset_symbol,
          price: parseFloat(manual_price),
          price_change_24h: parseFloat(manual_price_change_24h),
          price_change_percent_24h: parseFloat(manual_price_change_percent_24h),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'asset_id,asset_type'
        });

      return res.status(200).json({
        success: true,
        message: existing ? 'Price override updated' : 'Price override created',
        data: result
      });

    } catch (error) {
      console.error('Create/update price override error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // DELETE - Price override'ı sil (deaktive et)
  if (req.method === 'DELETE') {
    try {
      const { asset_symbol, asset_type } = req.query;

      if (!asset_symbol || !asset_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing asset_symbol or asset_type'
        });
      }

      // Silmek yerine deaktive et
      const { error } = await supabaseAdmin
        .from('price_overrides')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('asset_symbol', asset_symbol)
        .eq('asset_type', asset_type);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Price override deactivated'
      });

    } catch (error) {
      console.error('Delete price override error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}



