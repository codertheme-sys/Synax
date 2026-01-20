// pages/api/prices/crypto.js - Kripto Fiyat API (Binance + CoinGecko kombinasyonu)
import { createServerClient } from '../../../lib/supabase';
import { getAllPricesFromMultipleSources, getPopularCoinsList } from '../../../lib/multi-source-api';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 1; // 1 dakika

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if this is a cron job call (external cron service)
  // External cron services can send Authorization header or x-cron-secret header
  const cronSecret = process.env.CRON_SECRET || process.env.CRON_API_KEY;
  const providedSecret = req.query.secret || 
                         req.headers['authorization']?.replace('Bearer ', '') ||
                         req.headers['x-cron-secret'];
  
  const isCronJob = req.headers['x-vercel-cron'] === '1' || 
                    (cronSecret && providedSecret === cronSecret);
  
  // If it's a cron job, force update price_history (ignore cache)
  // If it's a regular request, use cache if available
  
  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Cron job check:', {
      isCronJob,
      hasCronSecret: !!cronSecret,
      providedSecret: providedSecret ? '***' : 'none',
      headers: {
        'x-vercel-cron': req.headers['x-vercel-cron'],
        'authorization': req.headers['authorization'] ? '***' : 'none',
        'x-cron-secret': req.headers['x-cron-secret'] ? '***' : 'none'
      },
      querySecret: req.query.secret ? '***' : 'none'
    });
  }

  try {
    const { ids, vs_currency = 'usd', force_update } = req.query;
    const supabaseAdmin = createServerClient();

    // Önce manuel override kontrolü
    const { data: priceOverrides } = await supabaseAdmin
      .from('price_overrides')
      .select('*')
      .eq('asset_type', 'crypto')
      .eq('is_active', true);

    // Cache kontrolü - sadece belirli coin'ler için (ids varsa)
    // Cron job'dan çağrıldığında cache'i atla ve her zaman güncelle
    let cachedData = null;
    let isCacheValid = false;
    
    // Cron job ise cache'i atla
    if (!isCronJob && !force_update && ids) {
      // Belirli coin'ler isteniyorsa cache kontrolü yap
      const cacheKey = ids;
      const { data: cached } = await supabaseAdmin
        .from('price_history')
        .select('*')
        .eq('asset_id', cacheKey)
        .eq('asset_type', 'crypto')
        .maybeSingle();

      if (cached) {
        const now = new Date();
        const cacheTime = cached.last_updated ? new Date(cached.last_updated) : null;
        isCacheValid = cacheTime && (now - cacheTime) < (CACHE_DURATION * 60 * 1000);
        cachedData = cached;
      }
    }

    // Cache geçerliyse ve belirli coin isteniyorsa cache'den dön (cron job değilse)
    if (!isCronJob && isCacheValid && cachedData && ids) {
      return res.status(200).json({
        success: true,
        data: [{
          id: cachedData.asset_id,
          symbol: cachedData.asset_symbol,
          name: cachedData.asset_name || cachedData.asset_symbol,
          current_price: parseFloat(cachedData.price),
          price_change_24h: parseFloat(cachedData.price_change_24h),
          price_change_percentage_24h: parseFloat(cachedData.price_change_percent_24h),
          market_cap: cachedData.market_cap ? parseFloat(cachedData.market_cap) : null,
          volume_24h: cachedData.volume_24h ? parseFloat(cachedData.volume_24h) : null,
          high_24h: cachedData.high_24h ? parseFloat(cachedData.high_24h) : null,
          low_24h: cachedData.low_24h ? parseFloat(cachedData.low_24h) : null,
          last_updated: cachedData.last_updated
        }],
        cached: true
      });
    }
    
    // Cache yoksa veya geçersizse yeni veri çek

    // Fetch prices from multiple sources (Binance + CoinGecko)
    let allData;
    try {
      console.log('Fetching prices from multiple sources...');
      allData = await getAllPricesFromMultipleSources();
      console.log('Multi-source API result:', {
        pricesCount: Object.keys(allData.prices || {}).length,
        sources: allData.sources
      });
      
      // Validate data structure
      if (!allData || !allData.prices || typeof allData.prices !== 'object') {
        console.error('Invalid data structure from getAllPricesFromMultipleSources:', allData);
        // Return empty data instead of throwing error
        return res.status(200).json({
          success: true,
          data: [],
          cached: false,
          warning: 'Price data unavailable, please try again later'
        });
      }
      
      // Check if prices object is empty
      if (Object.keys(allData.prices).length === 0) {
        console.error('Multi-source API returned empty prices object');
        return res.status(200).json({
          success: true,
          data: [],
          cached: false,
          warning: 'No price data available. Binance API may be timing out or unavailable.'
        });
      }
    } catch (error) {
      console.error('Multi-source API error:', error.message);
      console.error('Error stack:', error.stack);
      // Return empty data instead of 500 error
      return res.status(200).json({
        success: true,
        data: [],
        cached: false,
        warning: error.message || 'Failed to fetch prices, please try again later'
      });
    }

    // Coin ID mapping (symbol -> coinId) - CoinGecko ID'leri
    const SYMBOL_TO_COIN_ID = {
      'BTCUSDT': { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      'ETHUSDT': { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      'BNBUSDT': { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
      'ADAUSDT': { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
      'SOLUSDT': { id: 'solana', name: 'Solana', symbol: 'SOL' },
      'XRPUSDT': { id: 'ripple', name: 'Ripple', symbol: 'XRP' },
      'DOGEUSDT': { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
      'DOTUSDT': { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
      'AVAXUSDT': { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
      'LINKUSDT': { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
      'MATICUSDT': { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
      'LTCUSDT': { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
      'TRXUSDT': { id: 'tron', name: 'TRON', symbol: 'TRX' },
      'SHIBUSDT': { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB' },
      'UNIUSDT': { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
      'ATOMUSDT': { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
      'ETCUSDT': { id: 'ethereum-classic', name: 'Ethereum Classic', symbol: 'ETC' },
      'XLMUSDT': { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
      'ALGOUSDT': { id: 'algorand', name: 'Algorand', symbol: 'ALGO' },
      'VETUSDT': { id: 'vechain', name: 'VeChain', symbol: 'VET' },
      'GOLD': { id: 'gold', name: 'Gold (per oz)', symbol: 'GOLD' }
    };

    // Validate prices object
    if (!allData.prices || typeof allData.prices !== 'object' || Object.keys(allData.prices).length === 0) {
      console.error('No prices in allData:', allData);
      return res.status(200).json({
        success: true,
        data: [],
        cached: false,
        warning: 'No price data available'
      });
    }

    // İstenen coin'leri filtrele
    let requestedIds = ids ? ids.split(',') : null;
    
    // Markets data formatına çevir
    const marketsData = Object.entries(allData.prices)
      .map(([symbol, priceData]) => {
        // Validate priceData
        if (!priceData || typeof priceData !== 'object' || !priceData.price) {
          return null;
        }

        // Coin ID bul (varsa)
        const coinInfo = SYMBOL_TO_COIN_ID[symbol] || {
          id: symbol.toLowerCase().replace('usdt', ''),
          name: symbol.replace('USDT', ''),
          symbol: symbol.replace('USDT', '')
        };
        
        // Eğer belirli coin'ler isteniyorsa, filtrele
        if (requestedIds && !requestedIds.includes(coinInfo.id)) {
          return null;
        }

        try {
          return {
            id: coinInfo.id,
            symbol: coinInfo.symbol.toLowerCase(),
            name: coinInfo.name,
            current_price: parseFloat(priceData.price) || 0,
            price_change_24h: parseFloat(priceData.priceChange24h) || parseFloat(priceData.priceChangePercent24h) || 0,
            price_change_percentage_24h: parseFloat(priceData.priceChangePercent24h) || parseFloat(priceData.priceChange24h) || 0,
            total_volume: parseFloat(priceData.volume24h) || 0,
            high_24h: priceData.high24h ? parseFloat(priceData.high24h) : null,
            low_24h: priceData.low24h ? parseFloat(priceData.low24h) : null,
            source: priceData.source || 'binance'
          };
        } catch (parseError) {
          console.warn(`Error parsing price data for ${symbol}:`, parseError);
          return null;
        }
      })
      .filter(Boolean);

    // Validate marketsData
    if (!marketsData || marketsData.length === 0) {
      console.warn('No valid market data after processing');
      return res.status(200).json({
        success: true,
        data: [],
        cached: false,
        warning: 'No valid cryptocurrency data available'
      });
    }

    // Veriyi formatla ve cache'e kaydet
    const formattedData = marketsData
      .map((coin) => {
        try {
          // Manuel override kontrolü
          const override = (priceOverrides?.data || priceOverrides || [])?.find(o => o.asset_id === coin.id);
          
          const priceData = {
            id: coin.id,
            symbol: (coin.symbol || coin.id).toUpperCase(),
            name: coin.name || coin.id,
            current_price: override?.is_active ? parseFloat(override.manual_price) : (parseFloat(coin.current_price) || 0),
            price_change_24h: override?.is_active ? parseFloat(override.manual_price_change_24h) : (parseFloat(coin.price_change_24h) || 0),
            price_change_percentage_24h: override?.is_active ? parseFloat(override.manual_price_change_percent_24h) : (parseFloat(coin.price_change_percentage_24h) || 0),
            market_cap: coin.market_cap ? parseFloat(coin.market_cap) : null,
            volume_24h: coin.total_volume ? parseFloat(coin.total_volume) : null,
            high_24h: coin.high_24h ? parseFloat(coin.high_24h) : null,
            low_24h: coin.low_24h ? parseFloat(coin.low_24h) : null,
            last_updated: new Date().toISOString(),
            price_source: override?.is_active ? 'manual' : 'auto'
          };

          // Cache'e kaydet (async, hata vermesin - await kullanmadan)
          // Not: await kullanmıyoruz çünkü bu blocking olmamalı
          // Sadece kritik hataları logla, fetch failed gibi network hatalarını sessizce ignore et
          // ÖNEMLİ: asset_id olarak symbol kullanıyoruz (BTC, ETH) çünkü convert API ve portfolio tablosu symbol kullanıyor
          (async () => {
            try {
              // asset_id olarak symbol kullan (BTC, ETH) - coin.id değil (bitcoin, ethereum)
              // Bu sayede convert API ve diğer API'ler price_history'den fiyat bulabilir
              const assetIdForPriceHistory = priceData.symbol.toUpperCase(); // BTC, ETH, etc.
              
              const { error } = await supabaseAdmin
                .from('price_history')
                .upsert({
                  asset_type: 'crypto',
                  asset_id: assetIdForPriceHistory, // Symbol kullan (BTC, ETH) - coin.id değil
                  asset_symbol: priceData.symbol,
                  price: priceData.current_price,
                  price_change_24h: priceData.price_change_24h,
                  price_change_percent_24h: priceData.price_change_percentage_24h,
                  market_cap: priceData.market_cap,
                  volume_24h: priceData.volume_24h,
                  high_24h: priceData.high_24h,
                  low_24h: priceData.low_24h,
                  last_updated: priceData.last_updated
                }, {
                  onConflict: 'asset_id,asset_type'
                });
              
              // Sadece kritik hataları logla (fetch failed gibi network hatalarını ignore et)
              if (error && !error.message?.includes('fetch failed') && !error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
                console.error(`Cache error for ${assetIdForPriceHistory}:`, error.message);
              } else if (!error) {
                console.log(`Price saved to price_history: ${assetIdForPriceHistory} = ${priceData.current_price}`);
              }
            } catch (cacheError) {
              // Sadece kritik hataları logla (fetch failed gibi network hatalarını ignore et)
              if (cacheError.message && !cacheError.message.includes('fetch failed') && !cacheError.message.includes('ERR_INTERNET_DISCONNECTED')) {
                console.error(`Cache error for ${priceData.symbol}:`, cacheError.message);
              }
            }
          })();

          return priceData;
        } catch (formatError) {
          console.error(`Error formatting coin ${coin.id}:`, formatError);
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: formattedData,
      cached: false
    });

  } catch (error) {
    console.error('Get crypto prices error:', error);
    console.error('Error stack:', error.stack);
    // Return 200 with error message instead of 500
    return res.status(200).json({
      success: false,
      data: [],
      error: error.message || 'Failed to fetch prices',
      cached: false
    });
  }
}

