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

    // KYC check and get trade_win_lost_mode
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, kyc_verified, kyc_status, trade_win_lost_mode')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.kyc_verified || profile.kyc_status !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC verification is required. Please complete your KYC verification to start trading.',
        kyc_required: true 
      });
    }

    // Check if user has any active/pending trades
    // Only check for trades that are truly active (not expired)
    const now = new Date().toISOString();
    const { data: activeTrades, error: activeTradesError } = await supabaseAdmin
      .from('binary_trades')
      .select('id, status, admin_status, expires_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .eq('admin_status', 'approved')
      .gt('expires_at', now); // Only count trades that haven't expired yet

    if (activeTradesError) {
      console.error('Error checking active trades:', activeTradesError);
    }

    // Also check for expired active trades and auto-complete them
    const { data: expiredTrades } = await supabaseAdmin
      .from('binary_trades')
      .select('id, status, user_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('admin_status', 'approved')
      .lte('expires_at', now);

    if (expiredTrades && expiredTrades.length > 0) {
      // Auto-complete expired trades
      for (const expiredTrade of expiredTrades) {
        try {
          // Get user's trade_win_lost_mode
          const { data: userProfile } = await supabaseAdmin
            .from('profiles')
            .select('trade_win_lost_mode, balance')
            .eq('id', user.id)
            .single();

          if (userProfile) {
            const winLost = userProfile.trade_win_lost_mode || 'lost';
            
            // Get trade details
            const { data: tradeDetails } = await supabaseAdmin
              .from('binary_trades')
              .select('*')
              .eq('id', expiredTrade.id)
              .single();

            if (tradeDetails) {
              // Calculate last_price and profit
              const initialPrice = parseFloat(tradeDetails.initial_price);
              const randomPercent = 0.005 + Math.random() * 0.005;
              
              let lastPrice;
              if (winLost === 'win') {
                lastPrice = tradeDetails.side === 'buy' 
                  ? initialPrice * (1 + randomPercent)
                  : initialPrice * (1 - randomPercent);
              } else {
                lastPrice = tradeDetails.side === 'buy'
                  ? initialPrice * (1 - randomPercent)
                  : initialPrice * (1 + randomPercent);
              }
              lastPrice = Math.round(lastPrice * 100000000) / 100000000;

              const tradeAmount = parseFloat(tradeDetails.trade_amount);
              const profitPercentage = parseFloat(tradeDetails.potential_profit_percentage);
              const profitAmount = winLost === 'win'
                ? tradeAmount + (tradeAmount * profitPercentage / 100)
                : tradeAmount - (tradeAmount * profitPercentage / 100);

              // NOTE: Balance is NOT updated here - trade amount was already deducted when trade was created
              // Profit/loss is added directly to portfolio as crypto asset, not to cash balance

              // Add profitAmount as coin to portfolio
              try {
                console.log(`[binary-create] Looking for price: asset_id=${tradeDetails.asset_id}, asset_type=${tradeDetails.asset_type}, asset_symbol=${tradeDetails.asset_symbol}`);
                
                const { data: priceData, error: priceError } = await supabaseAdmin
                  .from('price_history')
                  .select('price')
                  .eq('asset_id', tradeDetails.asset_id)
                  .eq('asset_type', tradeDetails.asset_type)
                  .single();

                let currentPrice = null;
                let correctAssetId = tradeDetails.asset_id;

                if (priceError || !priceData || !priceData.price) {
                  console.error(`[binary-create] Price lookup error for ${tradeDetails.asset_symbol}:`, priceError);
                  // Try alternative lookup by symbol if asset_id doesn't match
                  const { data: priceDataBySymbol } = await supabaseAdmin
                    .from('price_history')
                    .select('price, asset_id')
                    .eq('asset_symbol', tradeDetails.asset_symbol.toUpperCase())
                    .eq('asset_type', tradeDetails.asset_type)
                    .single();
                  
                  if (priceDataBySymbol && priceDataBySymbol.price) {
                    console.log(`[binary-create] Found price by symbol for ${tradeDetails.asset_symbol}:`, priceDataBySymbol.price);
                    currentPrice = parseFloat(priceDataBySymbol.price);
                    correctAssetId = priceDataBySymbol.asset_id || tradeDetails.asset_id;
                  } else {
                    console.error(`[binary-create] No price found for ${tradeDetails.asset_symbol} by symbol either`);
                  }
                } else {
                  currentPrice = parseFloat(priceData.price);
                  correctAssetId = priceData.asset_id || tradeDetails.asset_id;
                }

                if (currentPrice && currentPrice > 0) {
                  // Calculate coin quantity from profitAmount (can be positive or negative)
                  // profitAmount includes both trade_amount and profit/loss
                  const coinQuantity = profitAmount / currentPrice;
                  
                  console.log(`[binary-create] Calculated coinQuantity for ${tradeDetails.asset_symbol}: ${coinQuantity} (profitAmount=${profitAmount}, currentPrice=${currentPrice})`);
                  
                  // Check if user already has this asset in portfolio (try both asset_id and symbol)
                  let existingPortfolio = null;
                  
                  // First try with correct asset_id
                  const { data: portfolioByAssetId } = await supabaseAdmin
                    .from('portfolio')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('asset_id', correctAssetId)
                    .eq('asset_type', tradeDetails.asset_type)
                    .maybeSingle();
                  
                  if (portfolioByAssetId) {
                    existingPortfolio = portfolioByAssetId;
                    console.log(`[binary-create] Found existing portfolio by asset_id for ${tradeDetails.asset_symbol}`);
                  } else {
                    // Try by symbol if asset_id doesn't match
                    const { data: portfolioBySymbol } = await supabaseAdmin
                      .from('portfolio')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('asset_symbol', tradeDetails.asset_symbol.toUpperCase())
                      .eq('asset_type', tradeDetails.asset_type)
                      .maybeSingle();
                    
                    if (portfolioBySymbol) {
                      existingPortfolio = portfolioBySymbol;
                      console.log(`[binary-create] Found existing portfolio by symbol for ${tradeDetails.asset_symbol}`);
                    }
                  }

                  if (existingPortfolio) {
                    const existingQuantity = parseFloat(existingPortfolio.quantity || 0);
                    const existingAveragePrice = parseFloat(existingPortfolio.average_price || 0);
                    const newQuantity = existingQuantity + coinQuantity;
                    
                    console.log(`[binary-create] Updating existing portfolio: existingQuantity=${existingQuantity}, coinQuantity=${coinQuantity}, newQuantity=${newQuantity}`);
                    
                    // If quantity becomes zero or negative, remove the portfolio entry
                    if (newQuantity <= 0) {
                      const { error: deleteError } = await supabaseAdmin
                        .from('portfolio')
                        .delete()
                        .eq('id', existingPortfolio.id);
                      
                      if (deleteError) {
                        console.error(`[binary-create] Error deleting portfolio entry:`, deleteError);
                      } else {
                        console.log(`[binary-create] Deleted portfolio entry for ${tradeDetails.asset_symbol} (quantity became ${newQuantity})`);
                      }
                    } else {
                      const totalValue = (existingQuantity * existingAveragePrice) + profitAmount;
                      const newAveragePrice = newQuantity > 0 ? totalValue / newQuantity : currentPrice;
                      const newTotalValue = newQuantity * currentPrice;
                      const profitLoss = newTotalValue - (newQuantity * newAveragePrice);
                      const profitLossPercent = newAveragePrice > 0 
                        ? ((currentPrice - newAveragePrice) / newAveragePrice) * 100 
                        : 0;

                      const { error: updateError } = await supabaseAdmin
                        .from('portfolio')
                        .update({
                          asset_id: correctAssetId, // Update asset_id to correct one
                          quantity: newQuantity,
                          average_price: newAveragePrice,
                          current_price: currentPrice,
                          total_value: newTotalValue,
                          profit_loss: profitLoss,
                          profit_loss_percent: profitLossPercent,
                          updated_at: now
                        })
                        .eq('id', existingPortfolio.id);
                      
                      if (updateError) {
                        console.error(`[binary-create] Error updating portfolio for ${tradeDetails.asset_symbol}:`, updateError);
                      } else {
                        console.log(`[binary-create] Successfully updated portfolio for ${tradeDetails.asset_symbol}: quantity=${newQuantity}, totalValue=${newTotalValue}`);
                      }
                    }
                  } else if (coinQuantity > 0) {
                    // Create new portfolio entry only if quantity is positive
                    const totalValue = coinQuantity * currentPrice;
                    const { data: newPortfolio, error: insertError } = await supabaseAdmin
                      .from('portfolio')
                      .insert({
                        user_id: user.id,
                        asset_id: correctAssetId,
                        asset_type: tradeDetails.asset_type,
                        asset_symbol: tradeDetails.asset_symbol.toUpperCase(),
                        asset_name: tradeDetails.asset_name,
                        quantity: coinQuantity,
                        average_price: currentPrice,
                        current_price: currentPrice,
                        total_value: totalValue,
                        profit_loss: 0,
                        profit_loss_percent: 0,
                        created_at: now,
                        updated_at: now
                      })
                      .select()
                      .single();
                    
                    if (insertError) {
                      console.error(`[binary-create] Error creating portfolio entry for ${tradeDetails.asset_symbol}:`, insertError);
                    } else {
                      console.log(`[binary-create] Successfully created portfolio entry for ${tradeDetails.asset_symbol}: quantity=${coinQuantity}, totalValue=${totalValue}, asset_id=${correctAssetId}`);
                    }
                  } else {
                    console.log(`[binary-create] Skipping portfolio update for ${tradeDetails.asset_symbol}: coinQuantity=${coinQuantity} (not positive)`);
                  }
                }
              } catch (portfolioError) {
                console.error('Error updating portfolio:', portfolioError);
              }

              // Update trade
              await supabaseAdmin
                .from('binary_trades')
                .update({
                  status: 'completed',
                  win_lost: winLost,
                  last_price: lastPrice,
                  updated_at: now
                })
                .eq('id', expiredTrade.id);
            }
          }
        } catch (error) {
          console.error('Error auto-completing expired trade:', error);
        }
      }
    }

    if (activeTrades && activeTrades.length > 0) {
      return res.status(400).json({ 
        error: 'You already have an active trade. Please wait for it to complete.',
        active_trades: activeTrades.length
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

    // Create binary trade record - automatically approved, status is active
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
        admin_status: 'approved', // Auto-approved (no admin approval needed)
        status: 'active', // Active immediately
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
