// pages/api/admin/binary-trade-approve.js
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

    const { trade_id, win_lost } = req.body;

    if (!trade_id || !win_lost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (win_lost !== 'win' && win_lost !== 'lost') {
      return res.status(400).json({ error: 'win_lost must be "win" or "lost"' });
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

    // Calculate last_price automatically based on win_lost and side
    const initialPrice = parseFloat(trade.initial_price);
    // Random percentage between 0.5% and 1% (0.005 to 0.01)
    const randomPercent = 0.005 + Math.random() * 0.005; // 0.005 to 0.01
    
    let lastPrice;
    if (win_lost === 'win') {
      // WIN: Price moves in favor of the trade
      if (trade.side === 'buy') {
        // BUY/LONG: Price goes up (0.5-1% above initial)
        lastPrice = initialPrice * (1 + randomPercent);
      } else {
        // SELL/SHORT: Price goes down (0.5-1% below initial)
        lastPrice = initialPrice * (1 - randomPercent);
      }
    } else {
      // LOST: Price moves against the trade
      if (trade.side === 'buy') {
        // BUY/LONG: Price goes down (0.5-1% below initial)
        lastPrice = initialPrice * (1 - randomPercent);
      } else {
        // SELL/SHORT: Price goes up (0.5-1% above initial)
        lastPrice = initialPrice * (1 + randomPercent);
      }
    }
    
    // Round to 8 decimal places
    lastPrice = Math.round(lastPrice * 100000000) / 100000000;

    // Calculate profit/loss
    let profitAmount = 0;
    const tradeAmount = parseFloat(trade.trade_amount);
    const profitPercentage = parseFloat(trade.potential_profit_percentage);
    
    if (win_lost === 'win') {
      // Win: return trade_amount + (trade_amount * potential_profit_percentage / 100)
      profitAmount = tradeAmount + (tradeAmount * profitPercentage / 100);
    } else {
      // Lost: return trade_amount - (trade_amount * potential_profit_percentage / 100)
      // This means user gets back: Trade Amount - (Trade Amount × Potential Profit %)
      profitAmount = tradeAmount - (tradeAmount * profitPercentage / 100);
    }

    // Update user balance
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', trade.user_id)
      .single();

    if (userProfile) {
      const newBalance = parseFloat(userProfile.balance || 0) + profitAmount;
      await supabaseAdmin
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', trade.user_id);
    }

    // Update trade
    const { error: updateError } = await supabaseAdmin
      .from('binary_trades')
      .update({
        admin_status: 'approved',
        admin_approved_by: user.id,
        admin_approved_at: new Date().toISOString(),
        last_price: lastPrice,
        win_lost: win_lost,
        status: 'completed',
      })
      .eq('id', trade_id);

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to update trade' });
    }

    return res.status(200).json({
      success: true,
      message: 'Trade approved successfully',
      profit_amount: profitAmount,
    });

  } catch (error) {
    console.error('Binary trade approve error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve trade'
    });
  }
}

