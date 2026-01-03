// pages/api/test/prices.js - Test Endpoint
// Binance ve CoinGecko API'lerini test etmek için

import { getAllBinancePrices } from '../../../lib/binance-api';
import { getAllPricesFromMultipleSources } from '../../../lib/multi-source-api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source = 'all' } = req.query;

    let result = {};

    // Binance test
    if (source === 'binance' || source === 'all') {
      try {
        const binancePrices = await getAllBinancePrices();
        const binanceCount = Object.keys(binancePrices).length;
        result.binance = {
          success: true,
          coin_count: binanceCount,
          sample_coins: Object.keys(binancePrices).slice(0, 10),
          sample_data: Object.entries(binancePrices).slice(0, 3).reduce((acc, [symbol, data]) => {
            acc[symbol] = {
              price: data.price,
              change24h: data.priceChangePercent24h
            };
            return acc;
          }, {})
        };
      } catch (error) {
        result.binance = {
          success: false,
          error: error.message
        };
      }
    }

    // Multi-source test
    if (source === 'multi' || source === 'all') {
      try {
        const multiData = await getAllPricesFromMultipleSources();
        result.multi_source = {
          success: true,
          total_coins: Object.keys(multiData.prices).length,
          sources: multiData.sources,
          has_gold: !!multiData.prices['GOLD'],
          sample_coins: Object.keys(multiData.prices).slice(0, 10),
          gold_price: multiData.prices['GOLD']?.price || null
        };
      } catch (error) {
        result.multi_source = {
          success: false,
          error: error.message
        };
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Test completed',
      results: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Test failed'
    });
  }
}

