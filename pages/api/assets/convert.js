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

    const { portfolio_id, asset_id, asset_type, asset_symbol, quantity } = req.body;

    if (!portfolio_id || !asset_id || !asset_type || !asset_symbol || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // USDT cannot be converted to USDT (it's already USDT)
    if (asset_symbol?.toUpperCase() === 'USDT' || asset_id?.toUpperCase() === 'USDT') {
      return res.status(400).json({ 
        success: false,
        error: 'USDT cannot be converted. USDT is already in USDT format. Use withdraw instead.' 
      });
    }

    // Get current portfolio item
    const { data: portfolioItem, error: portfolioError } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('id', portfolio_id)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolioItem) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    const currentQuantity = parseFloat(portfolioItem.quantity || 0);
    if (quantity > currentQuantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Get current price in USDT from CoinGecko API
    let currentPriceInUSDT = 0;
    try {
      // CoinGecko ID mapping
      const coinGeckoIds = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'USDT': 'tether',
        'BNB': 'binancecoin',
        'SOL': 'solana',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'AVAX': 'avalanche-2',
        'LTC': 'litecoin',
        'TRX': 'tron',
        'LINK': 'chainlink',
        'SHIB': 'shiba-inu',
      };
      
      // Get coin symbol (asset_symbol might be BTC, ETH, etc.)
      const coinSymbol = asset_symbol?.toUpperCase() || asset_id?.toUpperCase();
      const coinGeckoId = coinGeckoIds[coinSymbol];
      
      if (!coinGeckoId) {
        // Fallback: Try to get price from price_history
        const { data: priceData } = await supabaseAdmin
          .from('price_history')
          .select('price')
          .eq('asset_id', asset_id)
          .eq('asset_type', asset_type)
          .order('last_updated', { ascending: false })
          .limit(1)
          .single();
        
        if (priceData?.price) {
          currentPriceInUSDT = parseFloat(priceData.price);
          console.log(`Convert - Using cached price for ${coinSymbol}: ${currentPriceInUSDT} USDT`);
        } else {
          throw new Error(`Unsupported coin: ${coinSymbol}`);
        }
      } else {
        // First, try to get price from price_history (faster and more reliable)
        const { data: cachedPriceData, error: cachedPriceError } = await supabaseAdmin
          .from('price_history')
          .select('price')
          .eq('asset_id', asset_id)
          .eq('asset_type', asset_type)
          .order('last_updated', { ascending: false })
          .limit(1)
          .single();
        
        if (cachedPriceData?.price && !cachedPriceError) {
          currentPriceInUSDT = parseFloat(cachedPriceData.price);
          console.log(`Convert - Using cached price from price_history for ${coinSymbol}: ${currentPriceInUSDT} USDT`);
        } else {
          // Fallback: Fetch USDT price from CoinGecko
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const priceResponse = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usdt&include_24hr_change=true`,
              {
                headers: {
                  'Accept': 'application/json',
                },
                signal: controller.signal
              }
            );

            clearTimeout(timeoutId);

            if (!priceResponse.ok) {
              throw new Error(`CoinGecko API error: ${priceResponse.status}`);
            }

            const priceData = await priceResponse.json();
            const coinData = priceData[coinGeckoId];
            
            if (!coinData || !coinData.usdt) {
              throw new Error(`Price data not found for ${coinSymbol}`);
            }

            currentPriceInUSDT = parseFloat(coinData.usdt);
            console.log(`Convert - Fetched ${coinSymbol} price from CoinGecko: ${currentPriceInUSDT} USDT`);
            
            // Save to price_history for future use
            try {
              await supabaseAdmin
                .from('price_history')
                .upsert({
                  asset_type,
                  asset_id,
                  asset_symbol: coinSymbol,
                  price: currentPriceInUSDT,
                  price_change_24h: coinData.usdt_24h_change || 0,
                  price_change_percent_24h: coinData.usdt_24h_change || 0,
                  last_updated: new Date().toISOString()
                }, {
                  onConflict: 'asset_id,asset_type'
                });
              console.log(`Convert - Saved ${coinSymbol} price to price_history`);
            } catch (saveError) {
              console.warn('Convert - Failed to save price to price_history:', saveError);
              // Don't fail the convert operation if saving to price_history fails
            }
          } catch (coinGeckoError) {
            if (coinGeckoError.name === 'AbortError') {
              console.error('Convert - CoinGecko API timeout');
            } else {
              console.error('Convert - CoinGecko API error:', coinGeckoError);
            }
            throw coinGeckoError; // Re-throw to trigger fallback
          }
        }
      }
    } catch (priceError) {
      console.error('Convert - Price fetch error:', priceError);
      console.error('Convert - Price fetch error details:', {
        asset_symbol,
        asset_id,
        asset_type,
        error: priceError.message,
        stack: priceError.stack
      });
      
      // Final fallback: Try price_history one more time (in case it was updated)
      if (currentPriceInUSDT === 0) {
        try {
          const { data: priceData, error: priceHistoryError } = await supabaseAdmin
            .from('price_history')
            .select('price')
            .eq('asset_id', asset_id)
            .eq('asset_type', asset_type)
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();
          
          if (priceHistoryError) {
            console.error('Convert - Price history query error:', priceHistoryError);
          }
          
          if (priceData?.price) {
            currentPriceInUSDT = parseFloat(priceData.price);
            console.log(`Convert - Using final fallback price from price_history for ${asset_symbol}: ${currentPriceInUSDT} USDT`);
          } else {
            console.error(`Convert - No price found anywhere for ${asset_symbol} (${asset_id}, ${asset_type})`);
            return res.status(500).json({ 
              success: false,
              error: `Unable to fetch current price for ${asset_symbol}. Please try again in a few moments.` 
            });
          }
        } catch (fallbackError) {
          console.error('Convert - Final fallback price fetch failed:', fallbackError);
          console.error('Convert - Fallback error details:', {
            asset_symbol,
            asset_id,
            asset_type,
            error: fallbackError.message,
            stack: fallbackError.stack
          });
          return res.status(500).json({ 
            success: false,
            error: `Unable to fetch current price for ${asset_symbol}. Please try again in a few moments.` 
          });
        }
      }
    }

    // Calculate USDT value
    const usdtValue = quantity * currentPriceInUSDT;

    // Validate calculated values
    if (isNaN(usdtValue) || usdtValue <= 0) {
      console.error('Convert - Invalid USDT value calculated:', { quantity, currentPriceInUSDT, usdtValue });
      return res.status(500).json({ 
        success: false,
        error: 'Invalid conversion calculation. Please try again.' 
      });
    }

    // Update user balance (add USDT)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Convert - Profile error:', profileError);
      return res.status(404).json({ 
        success: false,
        error: 'User profile not found' 
      });
    }

    const currentBalance = parseFloat(profile.balance || 0);
    const newBalance = currentBalance + usdtValue;

    if (isNaN(newBalance)) {
      console.error('Convert - Invalid balance calculation:', { currentBalance, usdtValue, newBalance });
      return res.status(500).json({ 
        success: false,
        error: 'Invalid balance calculation. Please try again.' 
      });
    }

    const { error: balanceUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (balanceUpdateError) {
      console.error('Convert - Balance update error:', balanceUpdateError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update balance',
        details: process.env.NODE_ENV === 'development' ? balanceUpdateError.message : undefined
      });
    }

    console.log('Convert - Balance updated:', {
      user_id: user.id,
      oldBalance: currentBalance,
      usdtValue,
      newBalance
    });

    // Update portfolio - reduce quantity
    const newQuantity = currentQuantity - quantity;
    let finalPortfolioId = portfolio_id; // Keep portfolio_id for history, set to null if deleted
    
    if (newQuantity <= 0) {
      // Remove portfolio item if quantity is 0 or less
      const { error: deleteError } = await supabaseAdmin
        .from('portfolio')
        .delete()
        .eq('id', portfolio_id)
        .eq('user_id', user.id); // Ensure we're deleting the correct user's portfolio

      if (deleteError) {
        console.error('Convert - Portfolio delete error:', deleteError);
        console.error('Convert - Delete error details:', {
          portfolio_id,
          user_id: user.id,
          error: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint
        });
        return res.status(500).json({ 
          success: false,
          error: 'Failed to update portfolio',
          details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
        });
      }
      // Portfolio deleted, set portfolio_id to null for history
      finalPortfolioId = null;
      console.log('Convert - Portfolio item deleted:', { portfolio_id, user_id: user.id });
    } else {
      // Update portfolio item
      const newTotalValue = newQuantity * currentPriceInUSDT;
      const profitLoss = newTotalValue - (newQuantity * parseFloat(portfolioItem.average_price));
      const profitLossPercent = parseFloat(portfolioItem.average_price) > 0
        ? ((currentPriceInUSDT - parseFloat(portfolioItem.average_price)) / parseFloat(portfolioItem.average_price)) * 100
        : 0;

      const { error: updateError } = await supabaseAdmin
        .from('portfolio')
        .update({
          quantity: newQuantity,
          current_price: currentPriceInUSDT,
          total_value: newTotalValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolio_id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update portfolio' });
      }
    }

    // Create convert history record (optional - don't fail if table doesn't exist)
    let convertHistoryCreated = false;
    try {
      const { data: convertHistoryData, error: convertHistoryError } = await supabaseAdmin
        .from('convert_history')
        .insert({
          user_id: user.id,
          portfolio_id: finalPortfolioId, // Use finalPortfolioId (null if portfolio was deleted)
          asset_id: asset_id,
          asset_type: asset_type,
          asset_symbol: asset_symbol,
          quantity: quantity,
          price: currentPriceInUSDT,
          usd_value: usdtValue, // Keep field name as usd_value but store USDT value
          created_at: new Date().toISOString(),
        })
        .select();

      if (convertHistoryError) {
        // Check if table doesn't exist (PGRST116) or permission error
        if (convertHistoryError.code === 'PGRST116' || convertHistoryError.message?.includes('relation') || convertHistoryError.message?.includes('does not exist')) {
          console.warn('Convert history table not found. Please run database-convert-history-table.sql in Supabase.');
        } else if (convertHistoryError.code === '42501' || convertHistoryError.message?.includes('permission') || convertHistoryError.message?.includes('policy')) {
          // RLS policy violation - this shouldn't happen with service role key, but log it
          console.error('Convert history RLS error (unexpected with service role):', convertHistoryError);
          console.error('Convert history RLS error details:', {
            code: convertHistoryError.code,
            message: convertHistoryError.message,
            details: convertHistoryError.details,
            hint: convertHistoryError.hint,
            user_id: user.id
          });
        } else {
          console.error('Error creating convert history:', convertHistoryError);
          console.error('Convert history error details:', JSON.stringify(convertHistoryError, null, 2));
        }
        convertHistoryCreated = false;
      } else {
        console.log('Convert history created successfully:', convertHistoryData);
        convertHistoryCreated = true;
      }
    } catch (historyError) {
      // Catch any unexpected errors in history creation
      console.error('Unexpected error creating convert history:', historyError);
      console.error('Convert history exception details:', {
        message: historyError.message,
        stack: historyError.stack,
        user_id: user.id
      });
      convertHistoryCreated = false;
    }

    return res.status(200).json({
      success: true,
      message: `Converted successfully. ${quantity} ${asset_symbol} = ${usdtValue.toFixed(2)} USDT`,
      usdt_value: usdtValue,
      new_balance: newBalance,
      convert_history_created: convertHistoryCreated, // Indicate if history was created
    });

  } catch (error) {
    console.error('Convert error:', error);
    console.error('Convert error stack:', error.stack);
    console.error('Convert request body:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}



