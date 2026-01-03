// pages/api/webhooks/price-update.js - Price Update via Webhook
// For price updates from Stripe or other sources
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Webhook secret kontrolü (güvenlik için)
    const webhookSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET || 'synax-webhook-secret-2024';

    if (webhookSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized - Invalid webhook secret' });
    }

    const supabaseAdmin = createServerClient();
    const { prices, source = 'webhook' } = req.body;

    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({ error: 'Invalid prices data' });
    }

    const results = [];

    for (const priceData of prices) {
      const {
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        price,
        price_change_24h = 0,
        price_change_percent_24h = 0
      } = priceData;

      if (!asset_type || !asset_id || !price) {
        continue; // Geçersiz veri, atla
      }

      // Manuel override kontrolü - eğer aktif manuel override varsa, webhook fiyatını override'a kaydet ama kullanma
      const { data: existingOverride } = await supabaseAdmin
        .from('price_overrides')
        .select('*')
        .eq('asset_id', asset_id)
        .eq('asset_type', asset_type)
        .eq('is_active', true)
        .single();

      // Update price override (save price from webhook but don't use if not active)
      if (existingOverride) {
        // Override var ama webhook'tan gelen fiyatı kaydet (manuel müdahale için referans)
        await supabaseAdmin
          .from('price_overrides')
          .update({
            manual_price: parseFloat(price), // Webhook fiyatını kaydet
            manual_price_change_24h: parseFloat(price_change_24h),
            manual_price_change_percent_24h: parseFloat(price_change_percent_24h),
            source: source,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOverride.id);
      } else {
        // Override yoksa, webhook fiyatını otomatik olarak kullan
        await supabaseAdmin
          .from('price_overrides')
          .upsert({
            asset_type,
            asset_id,
            asset_symbol: asset_symbol || asset_id,
            asset_name: asset_name || asset_id,
            manual_price: parseFloat(price),
            manual_price_change_24h: parseFloat(price_change_24h),
            manual_price_change_percent_24h: parseFloat(price_change_percent_24h),
            is_active: false, // Webhook'tan gelen fiyat otomatik, manuel değil
            source: source,
            created_by: null // Sistem tarafından
          }, {
            onConflict: 'asset_id,asset_type'
          });
      }

      // Update price history (always)
      await supabaseAdmin
        .from('price_history')
        .upsert({
          asset_type,
          asset_id,
          asset_symbol: asset_symbol || asset_id,
          price: parseFloat(price),
          price_change_24h: parseFloat(price_change_24h),
          price_change_percent_24h: parseFloat(price_change_percent_24h),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'asset_id,asset_type'
        });

      // Update all portfolios with this asset
      const { data: portfolios } = await supabaseAdmin
        .from('portfolio')
        .select('*')
        .eq('asset_id', asset_id)
        .eq('asset_type', asset_type);

      if (portfolios && portfolios.length > 0) {
        const currentPrice = parseFloat(price);
        for (const portfolio of portfolios) {
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

      results.push({
        asset_id,
        asset_type,
        price: parseFloat(price),
        status: 'updated',
        override_active: existingOverride?.is_active || false
      });
    }

    return res.status(200).json({
      success: true,
      message: `${results.length} prices updated`,
      data: results
    });

  } catch (error) {
    console.error('Webhook price update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update prices'
    });
  }
}

