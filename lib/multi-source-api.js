// lib/multi-source-api.js - Çoklu Kaynak API Wrapper
// SADECE Binance (CoinGecko kaldırıldı - kullanıcı isteği)

import { getAllBinancePrices } from './binance-api';
// CoinGecko kaldırıldı - sadece Binance kullanıyoruz

const CACHE_DURATION = 5 * 1000; // 5 saniye cache
const priceCache = new Map();

/**
 * Tüm kaynaklardan fiyatları al (Binance + CoinGecko)
 * @returns {Promise<Object>} - {symbol: {price, priceChange24h, source, ...}}
 */
export async function getAllPricesFromMultipleSources() {
  const cacheKey = 'multi_source_all_prices';
  const cached = priceCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Binance'den kripto fiyatları (daha fazla coin, daha hızlı)
    // Timeout ile çağır (15 saniye max)
    let binancePrices = {};
    try {
      const binancePromise = getAllBinancePrices();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Binance API timeout')), 15000)
      );
      
      binancePrices = await Promise.race([binancePromise, timeoutPromise]);
      
      if (!binancePrices || typeof binancePrices !== 'object') {
        console.warn('Binance API returned invalid data');
        binancePrices = {};
      }
    } catch (binanceError) {
      console.error('Binance API error:', binanceError.message);
      binancePrices = {};
    }
    
    // CoinGecko KALDIRILDI - sadece Binance kullanıyoruz
    const coinGeckoPrices = {};

    // Altın fiyatı - fallback değer (CoinGecko kaldırıldı)
    // Binance'de altın trading pair'i yok, bu yüzden sabit değer kullanıyoruz
    const goldPrice = {
      price: 2050, // Ortalama altın fiyatı (per oz) - gerçek zamanlı değil
      priceChange24h: 0,
      priceChangePercent24h: 0,
      source: 'fallback'
    };

    // Birleştir: Binance öncelikli (daha güncel), CoinGecko fallback
    const combinedPrices = {};
    
    // Önce Binance fiyatlarını ekle
    Object.entries(binancePrices).forEach(([symbol, data]) => {
      combinedPrices[symbol] = {
        ...data,
        source: 'binance'
      };
    });

    // CoinGecko kaldırıldı - artık ekleme yok

    // Altın ekle
    if (goldPrice) {
      combinedPrices['GOLD'] = {
        ...goldPrice,
        symbol: 'GOLD',
        name: 'Gold (per oz)'
      };
    }

    // En azından birkaç coin olmalı
    const totalPrices = Object.keys(combinedPrices).length;
    if (totalPrices === 0) {
      console.error('No prices fetched from any source');
      console.error('Binance prices count:', Object.keys(binancePrices).length);
      console.error('CoinGecko prices count:', Object.keys(coinGeckoPrices).length);
      console.error('Gold price:', goldPrice ? 'exists' : 'missing');
      
      // Eğer hiç veri yoksa, boş obje döndür (API handle edecek)
      console.warn('Returning empty prices object - API will return empty array');
      return {
        prices: {},
        timestamp: Date.now(),
        sources: {
          binance: Object.keys(binancePrices).length,
          coingecko: Object.keys(coinGeckoPrices).length,
          gold: goldPrice ? 1 : 0
        }
      };
    }
    
    console.log(`Multi-source API: Combined ${totalPrices} prices (Binance: ${Object.keys(binancePrices).length}, CoinGecko: ${Object.keys(coinGeckoPrices).length}, Gold: ${goldPrice ? 1 : 0})`);

    const result = {
      prices: combinedPrices,
      timestamp: Date.now(),
      sources: {
        binance: Object.keys(binancePrices).length,
        coingecko: Object.keys(coinGeckoPrices).length,
        gold: goldPrice ? 1 : 0
      }
    };

    priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error('Multi-source API error:', error);
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

/**
 * Belirli coin'lerin fiyatlarını al
 */
export async function getPricesForSymbols(symbols) {
  const allData = await getAllPricesFromMultipleSources();
  const result = {};
  
  symbols.forEach(symbol => {
    const normalized = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}USDT`;
    
    if (allData.prices[normalized]) {
      result[normalized] = allData.prices[normalized];
    } else if (symbol.toUpperCase() === 'GOLD') {
      result['GOLD'] = allData.prices['GOLD'];
    }
  });

  return result;
}

/**
 * Popüler coin listesi (Binance'den en çok işlem gören 100+ coin)
 */
export function getPopularCoinsList() {
  return [
    // Top 20
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
    'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LTCUSDT', 'TRXUSDT', 'LINKUSDT',
    'SHIBUSDT', 'MATICUSDT', 'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'XLMUSDT',
    'ALGOUSDT', 'VETUSDT',
    // 21-50
    'ICPUSDT', 'FILUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
    'PEPEUSDT', 'FLOKIUSDT', 'WLDUSDT', 'SEIUSDT', 'TIAUSDT', 'INJUSDT',
    'RENDERUSDT', 'FETUSDT', 'AGIXUSDT', 'OCEANUSDT', 'GALAUSDT', 'SANDUSDT',
    'MANAUSDT', 'AXSUSDT', 'ENJUSDT', 'CHZUSDT', 'THETAUSDT', 'EOSUSDT',
    'AAVEUSDT', 'MKRUSDT', 'COMPUSDT', 'SNXUSDT', 'CRVUSDT', 'YFIUSDT',
    // 51-100
    'SUSHIUSDT', '1INCHUSDT', 'BALUSDT', 'ZRXUSDT', 'BATUSDT', 'ZECUSDT',
    'DASHUSDT', 'XMRUSDT', 'QTUMUSDT', 'ONTUSDT', 'ZILUSDT', 'IOSTUSDT',
    'CELRUSDT', 'ONEUSDT', 'HARMONYUSDT', 'IOTXUSDT', 'AUDIOUSDT', 'CTXCUSDT',
    'STPTUSDT', 'WAVESUSDT', 'OMGUSDT', 'ZENUSDT', 'SKLUSDT', 'GRTUSDT',
    'LRCUSDT', 'STORJUSDT', 'KNCUSDT', 'BANDUSDT', 'ANTUSDT', 'ROSEUSDT',
    'REEFUSDT', 'DENTUSDT', 'CELOUSDT', 'RIFUSDT', 'TRUUSDT', 'FISUSDT',
    'DOCKUSDT', 'PUNDIXUSDT', 'PROMUSDT', 'VTHOUSDT', 'ARKMUSDT', 'HBARUSDT',
    // Altın
    'GOLD'
  ];
}

