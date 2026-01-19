// pages/api/admin/deposit-approve.js - Deposit Onay/Red
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

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { deposit_id, action, notes } = req.body; // action: 'approve' or 'reject'

    if (!deposit_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Deposit bilgilerini al
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .single();

    if (depositError || !deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if deposit is already processed
    if (deposit.status !== 'pending' && deposit.status !== 'processing') {
      return res.status(400).json({ 
        success: false,
        error: `Deposit already ${deposit.status}. Cannot process again.` 
      });
    }

    if (action === 'approve') {
      // Get coin from deposit (payment_provider contains coin name: BTC, ETH, USDT)
      const coin = deposit.payment_provider?.toUpperCase() || null;
      const cryptoAmount = parseFloat(deposit.amount); // Crypto amount (e.g., 0.065 ETH, 500 USDT)
      
      if (!coin || !['BTC', 'ETH', 'USDT'].includes(coin)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid or missing coin information in deposit' 
        });
      }

      // Get current price from CoinGecko API
      let currentPrice = 0;
      try {
        // CoinGecko ID mapping
        const coinGeckoIds = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'USDT': 'tether'
        };
        
        const coinGeckoId = coinGeckoIds[coin];
        if (!coinGeckoId) {
          throw new Error(`Unsupported coin: ${coin}`);
        }

        // Fetch price from CoinGecko (use USD first, then convert if needed)
        // Note: CoinGecko may not always have USDT pair, so we use USD and assume 1:1 for USDT
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const priceResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd,usdt&include_24hr_change=true`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);

        if (!priceResponse.ok) {
          const errorText = await priceResponse.text();
          console.error(`CoinGecko API error ${priceResponse.status}:`, errorText);
          throw new Error(`CoinGecko API error: ${priceResponse.status}`);
        }

        const priceData = await priceResponse.json();
        const coinData = priceData[coinGeckoId];
        
        if (!coinData) {
          throw new Error(`Price data not found for ${coin} (${coinGeckoId})`);
        }

        // Prefer USDT price, fallback to USD price (assuming 1:1 for USDT)
        if (coinData.usdt !== undefined) {
          currentPrice = parseFloat(coinData.usdt);
        } else if (coinData.usd !== undefined) {
          // Use USD price as USDT is pegged to USD
          currentPrice = parseFloat(coinData.usd);
        } else {
          throw new Error(`No price data (usd or usdt) found for ${coin}`);
        }

        console.log(`Deposit approve - Fetched ${coin} price from CoinGecko: ${currentPrice} USDT`);
      } catch (priceError) {
        console.error('Deposit approve - Price fetch error:', priceError);
        // Fallback: Use price_history table if available
        try {
          const { data: priceHistory } = await supabaseAdmin
            .from('price_history')
            .select('price')
            .eq('asset_id', coin)
            .eq('asset_type', 'crypto')
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();
          
          if (priceHistory?.price) {
            currentPrice = parseFloat(priceHistory.price);
            console.log(`Deposit approve - Using cached price for ${coin}: $${currentPrice}`);
          } else {
            throw new Error('No price data available');
          }
        } catch (fallbackError) {
          console.error('Deposit approve - Fallback price fetch failed:', fallbackError);
          return res.status(500).json({
            success: false,
            error: `Failed to fetch price for ${coin}. Please try again.`
          });
        }
      }

      // Calculate total value in USDT
      const totalValue = cryptoAmount * currentPrice;

      // Check if portfolio item already exists for this coin
      const { data: existingPortfolio } = await supabaseAdmin
        .from('portfolio')
        .select('*')
        .eq('user_id', deposit.user_id)
        .eq('asset_id', coin)
        .eq('asset_type', 'crypto')
        .single();

      if (existingPortfolio) {
        // Update existing portfolio item
        const existingQuantity = parseFloat(existingPortfolio.quantity || 0);
        const existingAvgPrice = parseFloat(existingPortfolio.average_price || 0);
        const existingTotalValue = parseFloat(existingPortfolio.total_value || 0);
        
        // Calculate new average price (weighted average)
        const newQuantity = existingQuantity + cryptoAmount;
        const newTotalCost = (existingQuantity * existingAvgPrice) + (cryptoAmount * currentPrice);
        const newAvgPrice = newQuantity > 0 ? newTotalCost / newQuantity : currentPrice;
        const newTotalValue = newQuantity * currentPrice;
        const profitLoss = newTotalValue - newTotalCost;
        const profitLossPercent = newAvgPrice > 0 ? ((currentPrice - newAvgPrice) / newAvgPrice) * 100 : 0;

        await supabaseAdmin
          .from('portfolio')
          .update({
            quantity: newQuantity,
            average_price: newAvgPrice,
            current_price: currentPrice,
            total_value: newTotalValue,
            profit_loss: profitLoss,
            profit_loss_percent: profitLossPercent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPortfolio.id);

        console.log(`Deposit approve - Updated existing portfolio for ${coin}:`, {
          quantity: newQuantity,
          avgPrice: newAvgPrice,
          currentPrice,
          totalValue: newTotalValue
        });
      } else {
        // Create new portfolio item
        const { error: portfolioError } = await supabaseAdmin
          .from('portfolio')
          .insert({
            user_id: deposit.user_id,
            asset_type: 'crypto',
            asset_id: coin,
            asset_symbol: coin,
            asset_name: coin === 'BTC' ? 'Bitcoin' : coin === 'ETH' ? 'Ethereum' : 'Tether',
            quantity: cryptoAmount,
            average_price: currentPrice,
            current_price: currentPrice,
            total_value: totalValue,
            profit_loss: 0,
            profit_loss_percent: 0,
          });

        if (portfolioError) {
          console.error('Deposit approve - Portfolio insert error:', portfolioError);
          throw portfolioError;
        }

        console.log(`Deposit approve - Created new portfolio item for ${coin}:`, {
          quantity: cryptoAmount,
          price: currentPrice,
          totalValue
        });
      }

      // Deposit'i onayla
      const { data: updatedDeposit, error: updateError } = await supabaseAdmin
        .from('deposits')
        .update({
          status: 'completed',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit_id)
        .select()
        .single();

      if (updateError) {
        console.error('Deposit approve - Update error:', updateError);
        throw updateError;
      }

      console.log('Deposit approve - Updated deposit:', {
        id: updatedDeposit.id,
        status: updatedDeposit.status,
        coin,
        amount: cryptoAmount,
        price: currentPrice,
        totalValue
      });

      return res.status(200).json({
        success: true,
        message: `Deposit approved successfully. ${cryptoAmount} ${coin} added to portfolio.`,
        deposit: updatedDeposit
      });
    } else if (action === 'reject') {
      // Deposit'i reddet (processed_at and processed_by columns don't exist in schema)
      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit_id);

      return res.status(200).json({
        success: true,
        message: 'Deposit rejected'
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Deposit approve error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process deposit action'
    });
  }
}

