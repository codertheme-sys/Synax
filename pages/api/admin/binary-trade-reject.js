// pages/api/admin/binary-trade-reject.js
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { trade_id } = req.body;

    if (!trade_id) {
      return res.status(400).json({ error: 'Missing trade_id' });
    }

    // Get trade details
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('binary_trades')
      .select('*')
      .eq('id', trade_id)
      .single();

    if (tradeError || !trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.admin_status !== 'pending') {
      return res.status(400).json({ error: 'Trade already processed' });
    }

    // Refund trade amount to user
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', trade.user_id)
      .single();

    if (userProfile) {
      const newBalance = parseFloat(userProfile.balance || 0) + parseFloat(trade.trade_amount);
      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', trade.user_id);
    }

    // Update trade
    const { error: updateError } = await supabaseAdmin
      .from('binary_trades')
      .update({
        admin_status: 'rejected',
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
        status: 'cancelled',
      })
      .eq('id', trade_id);

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to update trade' });
    }

    return res.status(200).json({
      success: true,
      message: 'Trade rejected successfully',
    });

  } catch (error) {
    console.error('Binary trade reject error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject trade'
    });
  }
}






