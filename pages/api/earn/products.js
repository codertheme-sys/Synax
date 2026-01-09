// pages/api/earn/products.js - Earn Products API
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createServerClient();

    // Try to fetch earn products from database
    let products = null;
    let error = null;
    
    try {
      const result = await supabaseAdmin
        .from('earn_products')
        .select('*')
        .eq('is_active', true)
        .order('apr', { ascending: false });
      
      products = result.data;
      error = result.error;
    } catch (tableError) {
      // Table doesn't exist, use default products
      console.log('earn_products table not found, using default products');
      products = null;
    }

    // If table doesn't exist or no products in database, return default products
    // Generate products from popular Binance coins
    if (error || !products || products.length === 0) {
      const popularCoins = [
        { symbol: 'BTC', name: 'Bitcoin', apr: 3.5, type: 'Flexible' },
        { symbol: 'ETH', name: 'Ethereum', apr: 5.2, type: 'Locked', days: 30 },
        { symbol: 'SOL', name: 'Solana', apr: 6.8, type: 'Locked', days: 60 },
        { symbol: 'USDT', name: 'Tether', apr: 4.1, type: 'Flexible' },
        { symbol: 'BNB', name: 'BNB', apr: 4.5, type: 'Flexible' },
        { symbol: 'XRP', name: 'Ripple', apr: 5.0, type: 'Locked', days: 30 },
        { symbol: 'ADA', name: 'Cardano', apr: 5.5, type: 'Locked', days: 60 },
        { symbol: 'DOGE', name: 'Dogecoin', apr: 6.0, type: 'Flexible' },
        { symbol: 'DOT', name: 'Polkadot', apr: 5.8, type: 'Locked', days: 45 },
        { symbol: 'AVAX', name: 'Avalanche', apr: 6.2, type: 'Locked', days: 60 },
        { symbol: 'LTC', name: 'Litecoin', apr: 4.8, type: 'Flexible' },
        { symbol: 'TRX', name: 'TRON', apr: 5.3, type: 'Locked', days: 30 },
        { symbol: 'LINK', name: 'Chainlink', apr: 6.5, type: 'Locked', days: 90 },
        { symbol: 'MATIC', name: 'Polygon', apr: 5.7, type: 'Flexible' },
        { symbol: 'UNI', name: 'Uniswap', apr: 6.3, type: 'Locked', days: 60 },
        { symbol: 'ATOM', name: 'Cosmos', apr: 5.9, type: 'Locked', days: 45 },
        { symbol: 'XAU', name: 'Gold', apr: 2.5, type: 'Locked', days: 90 },
      ];

      const defaultProducts = popularCoins.map((coin, index) => ({
        id: index + 1,
        asset: coin.symbol,
        name: coin.name,
        type: coin.type,
        apr: `${coin.apr}%`,
        // Minimum amount USD cinsinden 500 olarak sabitlenir (UI'de de bu gösterilecek)
        minDeposit: '500',
        duration: coin.days ? `${coin.days} days` : 'Flexible',
        days: coin.days || null
      }));

      return res.status(200).json({
        success: true,
        data: defaultProducts
      });
    }

    // Format products
    const formattedProducts = products.map(product => ({
      id: product.id,
      asset: product.asset_symbol,
      name: product.asset_name,
      type: product.product_type === 'flexible' ? 'Flexible' : 'Locked',
      apr: `${product.apr}%`,
      // Minimum amount USD cinsinden 500 olarak sabitlenir (veri yoksa fallback)
      minDeposit: product.min_deposit?.toString() || '500',
      duration: product.product_type === 'flexible'
        ? 'Flexible'
        : (product.duration_days ? `${product.duration_days} days` : 'N/A'),
      days: product.product_type === 'flexible' ? null : product.duration_days
    }));

    return res.status(200).json({
      success: true,
      data: formattedProducts
    });

  } catch (error) {
    console.error('Earn products API error:', error);
    // Return default products on error instead of 500
    const popularCoins = [
      { symbol: 'BTC', name: 'Bitcoin', apr: 3.5, type: 'Flexible' },
      { symbol: 'ETH', name: 'Ethereum', apr: 5.2, type: 'Locked', days: 30 },
      { symbol: 'SOL', name: 'Solana', apr: 6.8, type: 'Locked', days: 60 },
      { symbol: 'USDT', name: 'Tether', apr: 4.1, type: 'Flexible' },
      { symbol: 'BNB', name: 'BNB', apr: 4.5, type: 'Flexible' },
      { symbol: 'XRP', name: 'Ripple', apr: 5.0, type: 'Locked', days: 30 },
      { symbol: 'ADA', name: 'Cardano', apr: 5.5, type: 'Locked', days: 60 },
      { symbol: 'DOGE', name: 'Dogecoin', apr: 6.0, type: 'Flexible' },
      { symbol: 'DOT', name: 'Polkadot', apr: 5.8, type: 'Locked', days: 45 },
      { symbol: 'AVAX', name: 'Avalanche', apr: 6.2, type: 'Locked', days: 60 },
      { symbol: 'LTC', name: 'Litecoin', apr: 4.8, type: 'Flexible' },
      { symbol: 'TRX', name: 'TRON', apr: 5.3, type: 'Locked', days: 30 },
      { symbol: 'LINK', name: 'Chainlink', apr: 6.5, type: 'Locked', days: 90 },
      { symbol: 'MATIC', name: 'Polygon', apr: 5.7, type: 'Flexible' },
      { symbol: 'UNI', name: 'Uniswap', apr: 6.3, type: 'Locked', days: 60 },
      { symbol: 'ATOM', name: 'Cosmos', apr: 5.9, type: 'Locked', days: 45 },
      { symbol: 'XAU', name: 'Gold', apr: 2.5, type: 'Locked', days: 90 },
    ];

    const defaultProducts = popularCoins.map((coin, index) => ({
      id: index + 1,
      asset: coin.symbol,
      name: coin.name,
      type: coin.type,
      apr: `${coin.apr}%`,
      minDeposit: '500', // Minimum amount USD
      duration: coin.days ? `${coin.days} days` : 'Flexible',
      days: coin.days || null
    }));

    return res.status(200).json({
      success: true,
      data: defaultProducts
    });
  }
}
