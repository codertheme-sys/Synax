// pages/api/alerts/create.js - Create Alert
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const {
      asset_symbol,
      asset_type,
      condition_type,
      condition_value,
      condition_operator
    } = req.body;

    // Validation
    if (!asset_symbol || !asset_type || !condition_type || !condition_value || !condition_operator) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create alert
    const { data: alert, error: insertError } = await supabaseAdmin
      .from('alerts')
      .insert({
        user_id: user.id,
        asset_symbol: asset_symbol.toUpperCase(),
        asset_type: asset_type.toLowerCase(),
        condition_type: condition_type,
        condition_value: parseFloat(condition_value),
        condition_operator: condition_operator,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating alert:', insertError);
      return res.status(500).json({ error: 'Failed to create alert' });
    }

    return res.status(200).json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Create alert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert'
    });
  }
}







