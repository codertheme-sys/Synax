// lib/coingecko-api.js - CoinGecko API Wrapper (MegaPlayZone'dan uyarlandı)
// CoinGecko Free Plan: 10-50 calls/minute (no API key needed)

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 10 * 1000; // 10 saniye cache
const MAX_CALLS_PER_MINUTE = 30; // Conservative limit for free plan

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
    return rateLimiter.calls.length < MAX_CALLS_PER_MINUTE;
  }
};

// CoinGecko ID mapping
const COIN_ID_MAP = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana',
  'XRPUSDT': 'ripple',
  'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin',
  'DOTUSDT': 'polkadot',
  'AVAXUSDT': 'avalanche-2',
  'LTCUSDT': 'litecoin',
  'TRXUSDT': 'tron',
  'LINKUSDT': 'chainlink',
  'SHIBUSDT': 'shiba-inu',
  'APTUSDT': 'aptos',
  'ARBUSDT': 'arbitrum',
  'PEPEUSDT': 'pepe'
};

/**
 * CoinGecko API'den tüm coin fiyatlarını al
 */
async function fetchFromMarketsEndpoint() {
  const coinIds = Object.values(COIN_ID_MAP).join(',');
  const response = await fetch(
    `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded - wait 1 minute');
    }
    const errorText = await response.text();
    throw new Error(`CoinGecko markets error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const timestamp = Date.now();
  return normalizeMarketsData(data, timestamp);
}

async function fetchFromSimplePriceEndpoint() {
  const coinIds = Object.values(COIN_ID_MAP).join(',');
  const response = await fetch(
    `${COINGECKO_API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&precision=6`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded - wait 1 minute');
    }
    const errorText = await response.text();
    throw new Error(`CoinGecko simple-price error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const timestamp = Date.now();

  const result = {};
  Object.entries(COIN_ID_MAP).forEach(([symbol, coinId]) => {
    const coinData = data[coinId];
    result[symbol] = {
      price: coinData?.usd ?? null,
      priceChange24h: coinData?.usd_24h_change ?? 0,
      volume24h: coinData?.usd_24h_vol ?? 0,
      timestamp
    };
  });
  return result;
}

function normalizeMarketsData(data, timestamp) {
  const result = {};
  Object.keys(COIN_ID_MAP).forEach(symbol => {
    result[symbol] = {
      price: null,
      priceChange24h: 0,
      volume24h: 0,
      timestamp
    };
  });

  if (Array.isArray(data)) {
    data.forEach(coinData => {
      const symbol = Object.keys(COIN_ID_MAP).find(
        key => COIN_ID_MAP[key] === coinData.id
      );

      if (symbol) {
        result[symbol] = {
          price: coinData.current_price ?? null,
          priceChange24h: coinData.price_change_percentage_24h ?? 0,
          volume24h: coinData.total_volume ?? 0,
          timestamp
        };
      }
    });
  }

  return result;
}

export async function getAllCoinPrices() {
  const cacheKey = 'all_prices';
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  if (!rateLimiter.canMakeCall()) {
    if (cached) {
      return cached.data;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  rateLimiter.addCall();

  try {
    const result = await fetchFromMarketsEndpoint();
    priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (marketError) {
    try {
      const fallbackResult = await fetchFromSimplePriceEndpoint();
      priceCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
      return fallbackResult;
    } catch (simpleError) {
      if (cached) {
        return cached.data;
      }
      throw simpleError;
    }
  }
}

export const SUPPORTED_COINS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿', coingeckoId: 'bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ', coingeckoId: 'ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB', icon: 'BNB', coingeckoId: 'binancecoin' },
  { symbol: 'SOLUSDT', name: 'Solana', icon: '◎', coingeckoId: 'solana' },
  { symbol: 'XRPUSDT', name: 'Ripple', icon: 'XRP', coingeckoId: 'ripple' },
  { symbol: 'ADAUSDT', name: 'Cardano', icon: 'ADA', coingeckoId: 'cardano' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'Ð', coingeckoId: 'dogecoin' },
  { symbol: 'DOTUSDT', name: 'Polkadot', icon: 'DOT', coingeckoId: 'polkadot' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', icon: 'AVAX', coingeckoId: 'avalanche-2' },
  { symbol: 'LTCUSDT', name: 'Litecoin', icon: 'Ł', coingeckoId: 'litecoin' },
  { symbol: 'TRXUSDT', name: 'TRON', icon: 'TRX', coingeckoId: 'tron' },
  { symbol: 'LINKUSDT', name: 'Chainlink', icon: '🔗', coingeckoId: 'chainlink' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', icon: '🐕', coingeckoId: 'shiba-inu' },
  { symbol: 'APTUSDT', name: 'Aptos', icon: 'APT', coingeckoId: 'aptos' },
  { symbol: 'ARBUSDT', name: 'Arbitrum', icon: 'ARB', coingeckoId: 'arbitrum' },
  { symbol: 'PEPEUSDT', name: 'Pepe', icon: '🐸', coingeckoId: 'pepe' }
];

export function normalizeSymbol(symbol) {
  if (!symbol) return null;
  const upper = symbol.toUpperCase();
  if (upper.endsWith('USDT')) return upper;
  return `${upper}USDT`;
}

