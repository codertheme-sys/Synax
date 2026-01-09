// pages/api/dashboard/update-portfolio-prices.js - Update Portfolio Prices from Price History
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createServerClient();

    // Get all portfolios
    const { data: allPortfolios, error: portfoliosError } = await supabaseAdmin
      .from('portfolio')
      .select('*');

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError);
      return res.status(500).json({ error: 'Failed to fetch portfolios' });
    }

    if (!allPortfolios || allPortfolios.length === 0) {
      return res.status(200).json({ success: true, message: 'No portfolios to update' });
    }

    // Get unique asset IDs
    const assetIds = [...new Set(allPortfolios.map(p => p.asset_id))];
    const assetTypes = [...new Set(allPortfolios.map(p => p.asset_type))];

    // Fetch current prices from price_history
    const { data: priceHistory, error: priceError } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .in('asset_id', assetIds)
      .in('asset_type', assetTypes);

    if (priceError) {
      console.error('Error fetching price history:', priceError);
      return res.status(500).json({ error: 'Failed to fetch price history' });
    }

    // Update each portfolio item with current price
    const updatePromises = allPortfolios.map(async (portfolio) => {
      const priceData = priceHistory?.find(
        p => p.asset_id === portfolio.asset_id && p.asset_type === portfolio.asset_type
      );

      if (!priceData) {
        // If no price data, try to fetch from API
        try {
          if (portfolio.asset_type === 'crypto') {
            const cryptoRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/crypto`);
            const cryptoData = await cryptoRes.json();
            if (cryptoData.success && cryptoData.data) {
              const asset = cryptoData.data.find(c => 
                c.id === portfolio.asset_id || c.symbol?.toUpperCase() === portfolio.asset_symbol?.toUpperCase()
              );
              if (asset) {
                const currentPrice = parseFloat(asset.current_price || 0);
                const quantity = parseFloat(portfolio.quantity || 0);
                const averagePrice = parseFloat(portfolio.average_price || 0);
                const totalValue = quantity * currentPrice;
                const profitLoss = totalValue - (quantity * averagePrice);
                const profitLossPercent = averagePrice > 0 
                  ? ((currentPrice - averagePrice) / averagePrice) * 100 
                  : 0;

                await supabaseAdmin
                  .from('portfolio')
                  .update({
                    current_price: currentPrice,
                    total_value: totalValue,
                    profit_loss: profitLoss,
                    profit_loss_percent: profitLossPercent,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', portfolio.id);
              }
            }
          } else if (portfolio.asset_type === 'gold') {
            const goldRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/prices/gold`);
            const goldData = await goldRes.json();
            if (goldData.success && goldData.data) {
              const currentPrice = parseFloat(goldData.data.current_price || 0);
              const quantity = parseFloat(portfolio.quantity || 0);
              const averagePrice = parseFloat(portfolio.average_price || 0);
              const totalValue = quantity * currentPrice;
              const profitLoss = totalValue - (quantity * averagePrice);
              const profitLossPercent = averagePrice > 0 
                ? ((currentPrice - averagePrice) / averagePrice) * 100 
                : 0;

              await supabaseAdmin
                .from('portfolio')
                .update({
                  current_price: currentPrice,
                  total_value: totalValue,
                  profit_loss: profitLoss,
                  profit_loss_percent: profitLossPercent,
                  updated_at: new Date().toISOString()
                })
                .eq('id', portfolio.id);
            }
          }
        } catch (err) {
          console.error(`Error updating portfolio ${portfolio.id}:`, err);
        }
        return;
      }

      // Update portfolio with price from price_history
      const currentPrice = parseFloat(priceData.price || 0);
      const quantity = parseFloat(portfolio.quantity || 0);
      const averagePrice = parseFloat(portfolio.average_price || 0);
      const totalValue = quantity * currentPrice;
      const profitLoss = totalValue - (quantity * averagePrice);
      const profitLossPercent = averagePrice > 0 
        ? ((currentPrice - averagePrice) / averagePrice) * 100 
        : 0;

      await supabaseAdmin
        .from('portfolio')
        .update({
          current_price: currentPrice,
          total_value: totalValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id);
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      success: true,
      message: `Updated ${allPortfolios.length} portfolio items`
    });

  } catch (error) {
    console.error('Update portfolio prices error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update portfolio prices'
    });
  }
}










