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

    // NOTE: Balance is NOT updated here - trade amount was already deducted when trade was created
    // Profit/loss is added directly to portfolio as crypto asset, not to cash balance

    // Add profitAmount as coin to portfolio
    // Get current price for the asset
    try {
      console.log(`[binary-auto-complete] Processing portfolio update for ${trade.asset_symbol}: asset_id=${trade.asset_id}, asset_type=${trade.asset_type}, profitAmount=${profitAmount}`);
      
      let currentPrice = null;
      let correctAssetId = trade.asset_id;
      
      // First try to get price by asset_id
      const { data: priceData, error: priceError } = await supabaseAdmin
        .from('price_history')
        .select('price, asset_id')
        .eq('asset_id', trade.asset_id)
        .eq('asset_type', trade.asset_type)
        .single();

      if (priceError || !priceData || !priceData.price) {
        console.log(`[binary-auto-complete] Price not found by asset_id for ${trade.asset_symbol}, trying by symbol...`);
        // Try alternative lookup by symbol if asset_id doesn't match
        const { data: priceDataBySymbol, error: symbolError } = await supabaseAdmin
          .from('price_history')
          .select('price, asset_id')
          .eq('asset_symbol', trade.asset_symbol.toUpperCase())
          .eq('asset_type', trade.asset_type)
          .single();
        
        if (symbolError) {
          console.error(`[binary-auto-complete] Price lookup by symbol also failed for ${trade.asset_symbol}:`, symbolError);
        } else if (priceDataBySymbol && priceDataBySymbol.price) {
          console.log(`[binary-auto-complete] Found price by symbol for ${trade.asset_symbol}: ${priceDataBySymbol.price}, asset_id=${priceDataBySymbol.asset_id}`);
          currentPrice = parseFloat(priceDataBySymbol.price);
          correctAssetId = priceDataBySymbol.asset_id || trade.asset_id;
        }
      } else {
        currentPrice = parseFloat(priceData.price);
        correctAssetId = priceData.asset_id || trade.asset_id;
        console.log(`[binary-auto-complete] Found price by asset_id for ${trade.asset_symbol}: ${currentPrice}`);
      }

      if (currentPrice && currentPrice > 0) {
        // Calculate coin quantity from profitAmount (can be positive or negative)
        // profitAmount includes both trade_amount and profit/loss
        const coinQuantity = profitAmount / currentPrice;
        console.log(`[binary-auto-complete] Calculated coinQuantity for ${trade.asset_symbol}: ${coinQuantity} (profitAmount=${profitAmount}, currentPrice=${currentPrice})`);
        
        // Check if user already has this asset in portfolio (try both asset_id and symbol)
        let existingPortfolio = null;
        
        // First try with correct asset_id
        const { data: portfolioByAssetId } = await supabaseAdmin
          .from('portfolio')
          .select('*')
          .eq('user_id', trade.user_id)
          .eq('asset_id', correctAssetId)
          .eq('asset_type', trade.asset_type)
          .maybeSingle();
        
        if (portfolioByAssetId) {
          existingPortfolio = portfolioByAssetId;
          console.log(`[binary-auto-complete] Found existing portfolio by asset_id for ${trade.asset_symbol}`);
        } else {
          // Try by symbol if asset_id doesn't match
          const { data: portfolioBySymbol } = await supabaseAdmin
            .from('portfolio')
            .select('*')
            .eq('user_id', trade.user_id)
            .eq('asset_symbol', trade.asset_symbol.toUpperCase())
            .eq('asset_type', trade.asset_type)
            .maybeSingle();
          
          if (portfolioBySymbol) {
            existingPortfolio = portfolioBySymbol;
            console.log(`[binary-auto-complete] Found existing portfolio by symbol for ${trade.asset_symbol}`);
          }
        }

        if (existingPortfolio) {
          // Update existing portfolio entry
          const existingQuantity = parseFloat(existingPortfolio.quantity || 0);
          const existingAveragePrice = parseFloat(existingPortfolio.average_price || 0);
          const newQuantity = existingQuantity + coinQuantity;
          
          console.log(`[binary-auto-complete] Updating existing portfolio: existingQuantity=${existingQuantity}, coinQuantity=${coinQuantity}, newQuantity=${newQuantity}`);
          
          // If quantity becomes zero or negative, remove the portfolio entry
          if (newQuantity <= 0) {
            const { error: deleteError } = await supabaseAdmin
              .from('portfolio')
              .delete()
              .eq('id', existingPortfolio.id);
            
            if (deleteError) {
              console.error(`[binary-auto-complete] Error deleting portfolio entry:`, deleteError);
            } else {
              console.log(`[binary-auto-complete] Deleted portfolio entry for ${trade.asset_symbol} (quantity became ${newQuantity})`);
            }
          } else {
            // Calculate weighted average price
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
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPortfolio.id);
            
            if (updateError) {
              console.error(`[binary-auto-complete] Error updating portfolio for ${trade.asset_symbol}:`, updateError);
            } else {
              console.log(`[binary-auto-complete] Successfully updated portfolio for ${trade.asset_symbol}: quantity=${newQuantity}, totalValue=${newTotalValue}`);
            }
          }
        } else if (coinQuantity > 0) {
          // Create new portfolio entry only if quantity is positive
          const totalValue = coinQuantity * currentPrice;
          const profitLoss = 0; // New entry, no profit/loss yet
          const profitLossPercent = 0;

          const { data: newPortfolio, error: insertError } = await supabaseAdmin
            .from('portfolio')
            .insert({
              user_id: trade.user_id,
              asset_id: correctAssetId,
              asset_type: trade.asset_type,
              asset_symbol: trade.asset_symbol.toUpperCase(),
              asset_name: trade.asset_name,
              quantity: coinQuantity,
              average_price: currentPrice,
              current_price: currentPrice,
              total_value: totalValue,
              profit_loss: profitLoss,
              profit_loss_percent: profitLossPercent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (insertError) {
            console.error(`[binary-auto-complete] Error creating portfolio entry for ${trade.asset_symbol}:`, insertError);
          } else {
            console.log(`[binary-auto-complete] Successfully created portfolio entry for ${trade.asset_symbol}: quantity=${coinQuantity}, totalValue=${totalValue}, asset_id=${correctAssetId}`);
          }
        } else {
          console.log(`[binary-auto-complete] Skipping portfolio update for ${trade.asset_symbol}: coinQuantity=${coinQuantity} (not positive)`);
        }
      } else {
        console.error(`[binary-auto-complete] No valid price found for ${trade.asset_symbol}. Cannot add to portfolio.`);
      }
    } catch (portfolioError) {
      // Log error but don't fail the trade completion
      console.error('Error updating portfolio:', portfolioError);
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
      last_price: lastPrice,
      note: 'Profit added to portfolio as crypto asset, not to cash balance'
    });

  } catch (error) {
    console.error('Binary trade auto-complete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete trade'
    });
  }
}
