// pages/api/trading/binary-create.js - Binary Options Trade Creation
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

    const { 
      asset_type, 
      asset_id, 
      asset_symbol, 
      asset_name, 
      side, 
      time_frame, 
      potential_profit_percentage, 
      trade_amount, 
      initial_price, 
      expires_at 
    } = req.body;

    if (!asset_type || !asset_id || !asset_symbol || !asset_name || !side || !time_frame || !potential_profit_percentage || !trade_amount || !initial_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (trade_amount <= 0 || initial_price <= 0) {
      return res.status(400).json({ error: 'Invalid trade amount or price' });
    }

    // KYC check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, kyc_verified, kyc_status')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.kyc_verified || profile.kyc_status !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC verification required',
        kyc_required: true 
      });
    }

    // Check balance
    if (parseFloat(profile.balance) < trade_amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: trade_amount,
        available: parseFloat(profile.balance)
      });
    }

    // Deduct trade amount from balance
    const newBalance = parseFloat(profile.balance) - trade_amount;
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Create binary trade record
    const expiresAtValue = expires_at || new Date(Date.now() + time_frame * 1000).toISOString();
    
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('binary_trades')
      .insert({
        user_id: user.id,
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        side,
        time_frame,
        potential_profit_percentage: parseFloat(potential_profit_percentage),
        trade_amount: parseFloat(trade_amount),
        initial_price: parseFloat(initial_price),
        expires_at: expiresAtValue,
        admin_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating binary trade:', tradeError);
      console.error('Trade error details:', JSON.stringify(tradeError, null, 2));
      // Refund balance if trade creation fails
      await supabaseAdmin
        .from('profiles')
        .update({ balance: parseFloat(profile.balance) })
        .eq('id', user.id);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create trade',
        details: tradeError.message || 'Unknown error'
      });
    }

    return res.status(200).json({
      success: true,
      data: trade,
      message: 'Trade created successfully'
    });

  } catch (error) {
    console.error('Binary trade creation error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create trade',
      details: error.stack
    });
  }
}

