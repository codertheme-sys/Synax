// pages/api/trading/binary-auto-complete.js - Auto-complete expired trades
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

    if (tradeError) {
      console.error('Error fetching trade:', tradeError);
      return res.status(404).json({ 
        success: false,
        error: 'Trade not found',
        details: tradeError.message 
      });
    }

    if (!trade) {
      return res.status(404).json({ 
        success: false,
        error: 'Trade not found' 
      });
    }

    // Verify trade belongs to the authenticated user
    if (trade.user_id !== user.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized: Trade does not belong to this user' 
      });
    }

    // Check if trade is already completed
    if (trade.status === 'completed') {
      return res.status(200).json({ 
        success: true,
        win_lost: trade.win_lost,
        message: 'Trade already completed'
      });
    }

    // Get user's trade_win_lost_mode from profile
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('trade_win_lost_mode, balance')
      .eq('id', trade.user_id)
      .single();

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const winLost = userProfile.trade_win_lost_mode || 'lost';

    // Calculate last_price automatically based on win_lost and side
    const initialPrice = parseFloat(trade.initial_price);
    const randomPercent = 0.005 + Math.random() * 0.005; // 0.005 to 0.01
    
    let lastPrice;
    if (winLost === 'win') {
      // WIN: Price moves in favor of the trade
      if (trade.side === 'buy') {
        // BUY/LONG: Price goes up
        lastPrice = initialPrice * (1 + randomPercent);
      } else {
        // SELL/SHORT: Price goes down
        lastPrice = initialPrice * (1 - randomPercent);
      }
    } else {
      // LOST: Price moves against the trade
      if (trade.side === 'buy') {
        // BUY/LONG: Price goes down
        lastPrice = initialPrice * (1 - randomPercent);
      } else {
        // SELL/SHORT: Price goes up
        lastPrice = initialPrice * (1 + randomPercent);
      }
    }
    
    // Round to 8 decimal places
    lastPrice = Math.round(lastPrice * 100000000) / 100000000;

    // Calculate profit/loss
    let profitAmount = 0;
    const tradeAmount = parseFloat(trade.trade_amount);
    const profitPercentage = parseFloat(trade.potential_profit_percentage);
    
    if (winLost === 'win') {
      // Win: return trade_amount + (trade_amount * potential_profit_percentage / 100)
      profitAmount = tradeAmount + (tradeAmount * profitPercentage / 100);
    } else {
      // Lost: return trade_amount - (trade_amount * potential_profit_percentage / 100)
      profitAmount = tradeAmount - (tradeAmount * profitPercentage / 100);
    }

    // Update user balance
    const currentBalance = parseFloat(userProfile.balance || 0);
    const newBalance = currentBalance + profitAmount;
    
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', trade.user_id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Update trade
    const { error: updateError } = await supabaseAdmin
      .from('binary_trades')
      .update({
        admin_status: 'approved',
        last_price: lastPrice,
        win_lost: winLost,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', trade_id);

    if (updateError) {
      console.error('Error updating trade:', updateError);
      return res.status(500).json({ error: 'Failed to update trade' });
    }

    return res.status(200).json({
      success: true,
      message: 'Trade completed successfully',
      win_lost: winLost,
      profit_amount: profitAmount,
      last_price: lastPrice
    });

  } catch (error) {
    console.error('Binary trade auto-complete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete trade'
    });
  }
}

