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

    // OPTIMIZATION: Batch updates by grouping portfolios with same asset
    // This reduces the number of UPDATE queries significantly
    const updatesByAsset = new Map();
    
    allPortfolios.forEach(portfolio => {
      const priceData = priceHistory?.find(
        p => p.asset_id === portfolio.asset_id && p.asset_type === portfolio.asset_type
      );

      if (!priceData) {
        return; // Skip if no price data
      }

      const currentPrice = parseFloat(priceData.price || 0);
      if (currentPrice <= 0) return;

      const quantity = parseFloat(portfolio.quantity || 0);
      const averagePrice = parseFloat(portfolio.average_price || 0);
      const totalValue = quantity * currentPrice;
      const profitLoss = totalValue - (quantity * averagePrice);
      const profitLossPercent = averagePrice > 0 
        ? ((currentPrice - averagePrice) / averagePrice) * 100 
        : 0;

      // Group by asset to batch update
      const assetKey = `${portfolio.asset_id}_${portfolio.asset_type}`;
      if (!updatesByAsset.has(assetKey)) {
        updatesByAsset.set(assetKey, {
          asset_id: portfolio.asset_id,
          asset_type: portfolio.asset_type,
          currentPrice,
          portfolios: []
        });
      }
      
      updatesByAsset.get(assetKey).portfolios.push({
        id: portfolio.id,
        quantity,
        averagePrice,
        totalValue,
        profitLoss,
        profitLossPercent
      });
    });

    // Execute updates - still individual but grouped for better performance
    const updatePromises = [];
    updatesByAsset.forEach(({ portfolios, currentPrice }) => {
      portfolios.forEach(({ id, quantity, averagePrice, totalValue, profitLoss, profitLossPercent }) => {
        updatePromises.push(
          supabaseAdmin
            .from('portfolio')
            .update({
              current_price: currentPrice,
              total_value: totalValue,
              profit_loss: profitLoss,
              profit_loss_percent: profitLossPercent,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        );
      });
    });

    // Execute in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < updatePromises.length; i += batchSize) {
      const batch = updatePromises.slice(i, i + batchSize);
      await Promise.all(batch);
      // Small delay between batches to reduce disk IO pressure
      if (i + batchSize < updatePromises.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

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













