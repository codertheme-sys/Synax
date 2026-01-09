// pages/api/admin/set-user-trade-mode.js - Set user trade win/lost mode
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
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

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, trade_mode } = req.body;

    if (!user_id || !trade_mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (trade_mode !== 'win' && trade_mode !== 'lost') {
      return res.status(400).json({ error: 'trade_mode must be "win" or "lost"' });
    }

    // Update user's trade_win_lost_mode
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        trade_win_lost_mode: trade_mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating trade mode:', updateError);
      return res.status(500).json({ error: 'Failed to update trade mode' });
    }

    // Update all active/pending trades for this user if mode changed
    // This will affect ongoing trades as requested
    const { data: activeTrades } = await supabaseAdmin
      .from('binary_trades')
      .select('id, status, admin_status')
      .eq('user_id', user_id)
      .in('status', ['pending', 'active'])
      .eq('admin_status', 'approved');

    // Note: We don't update trades here immediately, 
    // but the auto-complete endpoint will use the new mode when trades expire

    return res.status(200).json({
      success: true,
      message: 'Trade mode updated successfully',
      trade_mode: trade_mode,
      affected_trades: activeTrades?.length || 0
    });

  } catch (error) {
    console.error('Set user trade mode error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update trade mode'
    });
  }
}




import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
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

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { user_id, trade_mode } = req.body;

    if (!user_id || !trade_mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (trade_mode !== 'win' && trade_mode !== 'lost') {
      return res.status(400).json({ error: 'trade_mode must be "win" or "lost"' });
    }

    // Update user's trade_win_lost_mode
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        trade_win_lost_mode: trade_mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating trade mode:', updateError);
      return res.status(500).json({ error: 'Failed to update trade mode' });
    }

    // Update all active/pending trades for this user if mode changed
    // This will affect ongoing trades as requested
    const { data: activeTrades } = await supabaseAdmin
      .from('binary_trades')
      .select('id, status, admin_status')
      .eq('user_id', user_id)
      .in('status', ['pending', 'active'])
      .eq('admin_status', 'approved');

    // Note: We don't update trades here immediately, 
    // but the auto-complete endpoint will use the new mode when trades expire

    return res.status(200).json({
      success: true,
      message: 'Trade mode updated successfully',
      trade_mode: trade_mode,
      affected_trades: activeTrades?.length || 0
    });

  } catch (error) {
    console.error('Set user trade mode error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update trade mode'
    });
  }
}









