// lib/binance-api.js - Binance Public API Wrapper
// ÜCRETSİZ - API key gerekmez (public endpoints)
// Rate limit: 1200 requests/minute (yeterli!)

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const CACHE_DURATION = 5 * 1000; // 5 saniye cache (daha sık güncelleme)

// In-memory cache
const priceCache = new Map();
const rateLimiter = {
  calls: [],
  addCall: () => {
    const now = Date.now();
    rateLimiter.calls = rateLimiter.calls.filter(time => now - time < 60000);
    rateLimiter.calls.push(now);
  },
  canMakeCall: () => {
    const now = Date.now();
    rateLimiter.calls = rateLimiter.calls.filter(time => now - time < 60000);
    return rateLimiter.calls.length < 1000; // Binance limit: 1200/min, güvenli limit
  }
};

/**
 * Binance'den tüm USDT trading pair'lerini al
 * @returns {Promise<Object>} - {symbol: {price, priceChange24h, volume24h, ...}}
 */
export async function getAllBinancePrices() {
  const cacheKey = 'binance_all_prices';
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  if (!rateLimiter.canMakeCall()) {
    if (cached) {
      return cached.data;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  rateLimiter.addCall();

  try {
    // Binance 24hr ticker statistics - Tüm trading pair'ler için
    // Timeout ekle (8 saniye - daha kısa)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    let response;
    try {
      response = await fetch(`${BINANCE_API_BASE}/ticker/24hr`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Binance API timeout (8s)');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const timestamp = Date.now();

    // Validate response data
    if (!Array.isArray(data)) {
      throw new Error('Binance API returned invalid data format');
    }

    // Sadece USDT pair'lerini filtrele ve formatla (ilk 200 coin - performans için)
    const result = {};
    let processedCount = 0;
    const MAX_COINS = 200; // İlk 200 coin'i işle (daha hızlı)
    
    for (const ticker of data) {
      if (processedCount >= MAX_COINS) break;
      
      if (ticker && ticker.symbol && ticker.symbol.endsWith('USDT')) {
        try {
          const symbol = ticker.symbol;
          const price = parseFloat(ticker.lastPrice);
          const openPrice = parseFloat(ticker.openPrice);
          
          // Validate price data
          if (isNaN(price) || isNaN(openPrice) || price <= 0) {
            continue; // Skip invalid data
          }
          
          const priceChange = price - openPrice;
          const priceChangePercent = openPrice > 0 ? (priceChange / openPrice) * 100 : 0;

          result[symbol] = {
            price: price,
            priceChange24h: priceChange,
            priceChangePercent24h: priceChangePercent,
            volume24h: parseFloat(ticker.volume) || 0,
            high24h: parseFloat(ticker.highPrice) || price,
            low24h: parseFloat(ticker.lowPrice) || price,
            timestamp: timestamp
          };
          processedCount++;
        } catch (tickerError) {
          console.warn(`Error processing ticker ${ticker.symbol}:`, tickerError);
          // Continue with next ticker
        }
      }
    }

    // Validate result
    if (Object.keys(result).length === 0) {
      console.warn('Binance API returned no valid USDT pairs');
      if (cached && Object.keys(cached.data).length > 0) {
        console.log('Using cached Binance data (no new data available)');
        return cached.data;
      }
      console.error('No valid price data from Binance and no cache available');
      // Boş obje döndür, hata fırlatma (multi-source API handle edecek)
      return {};
    }

    console.log(`Binance API: Fetched ${Object.keys(result).length} coins`);
    priceCache.set(cacheKey, { data: result, timestamp: timestamp });
    return result;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Binance API timeout (10s)');
    } else {
      console.error('Binance API error:', error.message);
    }
    
    if (cached) {
      console.log('Using cached Binance data due to error');
      return cached.data;
    }
    // Return empty object instead of throwing to prevent 500 error
    console.error('No cached data available, returning empty result');
    return {};
  }
}

/**
 * Belirli bir coin'in fiyatını al
 */
export async function getBinancePrice(symbol) {
  const allPrices = await getAllBinancePrices();
  const normalizedSymbol = symbol.toUpperCase().endsWith('USDT') 
    ? symbol.toUpperCase() 
    : `${symbol.toUpperCase()}USDT`;
  
  return allPrices[normalizedSymbol] || null;
}

/**
 * Popüler coin'lerin listesi (Binance'de en çok işlem gören)
 */
export const POPULAR_BINANCE_COINS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LTCUSDT', 'TRXUSDT', 'LINKUSDT',
  'SHIBUSDT', 'MATICUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'XLMUSDT',
  'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT',
  'OPUSDT', 'SUIUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'WLDUSDT', 'SEIUSDT',
  'TIAUSDT', 'INJUSDT', 'RENDERUSDT', 'FETUSDT', 'AGIXUSDT', 'OCEANUSDT',
  'GALAUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'ENJUSDT', 'CHZUSDT',
  'THETAUSDT', 'EOSUSDT', 'AAVEUSDT', 'MKRUSDT', 'COMPUSDT', 'SNXUSDT',
  'CRVUSDT', 'YFIUSDT', 'SUSHIUSDT', '1INCHUSDT', 'BALUSDT', 'ZRXUSDT'
];

