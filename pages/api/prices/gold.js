// pages/api/prices/gold.js - Altın Fiyat API
import { createServerClient } from '../../../lib/supabase';

const CACHE_DURATION = 5; // 5 dakika

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currency = 'usd' } = req.query;
    const supabaseAdmin = createServerClient();

    // Önce manuel override kontrolü
    const { data: goldOverride } = await supabaseAdmin
      .from('price_overrides')
      .select('*')
      .eq('asset_id', 'gold')
      .eq('asset_type', 'gold')
      .eq('is_active', true)
      .single();

    // Cache kontrolü
    const { data: cachedData } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .eq('asset_id', 'gold')
      .eq('asset_type', 'gold')
      .single();

    const now = new Date();
    const cacheTime = cachedData?.last_updated 
      ? new Date(cachedData.last_updated) 
      : null;
    
    const isCacheValid = cacheTime && 
      (now - cacheTime) < (CACHE_DURATION * 60 * 1000);

    if (isCacheValid && cachedData) {
      return res.status(200).json({
        success: true,
        data: {
          id: 'gold',
          symbol: 'GOLD',
          name: 'Gold (per oz)',
          current_price: parseFloat(cachedData.price),
          price_change_24h: parseFloat(cachedData.price_change_24h),
          price_change_percentage_24h: parseFloat(cachedData.price_change_percent_24h),
          currency: currency.toUpperCase(),
          last_updated: cachedData.last_updated
        },
        cached: true
      });
    }

    // Fetch gold price
    let goldPrice = null;
    let priceChange24h = 0;

    try {
      // CoinGecko'da altın için farklı ID'ler dene
      // Not: CoinGecko'da "gold" ID'si yok, alternatifler kullanılmalı
      const coinGeckoUrls = [
        'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true',
        'https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true'
      ];
      
      for (const url of coinGeckoUrls) {
        try {
          const cgResponse = await fetch(url);
          if (cgResponse.ok) {
            const cgData = await cgResponse.json();
            const goldData = cgData['pax-gold'] || cgData['tether-gold'];
            if (goldData && goldData.usd) {
              const price = parseFloat(goldData.usd);
              // Fiyat mantıklı mı kontrol et (100-5000 arası)
              if (price >= 100 && price <= 5000) {
                goldPrice = price;
                priceChange24h = goldData.usd_24h_change || 0;
                break;
              }
            }
          }
        } catch (urlErr) {
          continue; // Bir sonraki URL'yi dene
        }
      }
      
      // Eğer hala fiyat yoksa, fallback kullan
      if (!goldPrice || goldPrice < 100 || goldPrice > 5000) {
        console.log('CoinGecko gold price invalid, using fallback: $2050');
        goldPrice = 2050; // Ortalama altın fiyatı (per oz)
        priceChange24h = 0;
      }
    } catch (err) {
      console.log('All gold APIs failed, using fallback...', err.message);
      goldPrice = 2050; // Fallback
      priceChange24h = 0;
    }

    // Manuel override varsa onu kullan
    const finalPrice = goldOverride?.is_active 
      ? parseFloat(goldOverride.manual_price) 
      : goldPrice;
    const finalChange24h = goldOverride?.is_active 
      ? parseFloat(goldOverride.manual_price_change_24h) 
      : priceChange24h;
    const finalChangePercent = goldOverride?.is_active 
      ? parseFloat(goldOverride.manual_price_change_percent_24h) 
      : priceChange24h;

    const goldData = {
      id: 'gold',
      symbol: 'GOLD',
      name: 'Gold (per oz)',
      current_price: finalPrice,
      price_change_24h: finalChange24h,
      price_change_percentage_24h: finalChangePercent,
      currency: currency.toUpperCase(),
      last_updated: new Date().toISOString(),
      price_source: goldOverride?.is_active ? 'manual' : 'auto' // Fiyat kaynağı bilgisi
    };

    // Cache'e kaydet (hata yakalama ile)
    try {
      const { error } = await supabaseAdmin
        .from('price_history')
        .upsert({
          asset_type: 'gold',
          asset_id: 'gold',
          asset_symbol: 'GOLD',
          price: goldPrice,
          price_change_24h: priceChange24h,
          price_change_percent_24h: priceChange24h,
          last_updated: goldData.last_updated
        }, {
          onConflict: 'asset_id,asset_type'
        });
      
      // Sadece kritik hataları logla (fetch failed gibi network hatalarını ignore et)
      if (error && !error.message?.includes('fetch failed') && !error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
        console.error('Gold cache error:', error.message);
      }
    } catch (cacheError) {
      // Sadece kritik hataları logla (fetch failed gibi network hatalarını ignore et)
      if (cacheError.message && !cacheError.message.includes('fetch failed') && !cacheError.message.includes('ERR_INTERNET_DISCONNECTED')) {
        console.error('Gold cache error:', cacheError.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: goldData,
      cached: false
    });

  } catch (error) {
    console.error('Get gold price error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch gold price'
    });
  }
}

