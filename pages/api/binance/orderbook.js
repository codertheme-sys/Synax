// pages/api/binance/orderbook.js - Binance Order Book API
// Fetches real-time order book data (bids/asks) from Binance

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// Generate mock orderbook data as fallback when Binance API is unavailable (451 error)
function generateMockOrderBook(symbol, limit = 20) {
  // Get approximate price for common symbols
  const priceMap = {
    'BTCUSDT': 50000,
    'ETHUSDT': 3000,
    'BNBUSDT': 600,
    'SOLUSDT': 100,
    'XRPUSDT': 0.6,
    'ADAUSDT': 0.5,
    'DOGEUSDT': 0.08,
    'DOTUSDT': 7,
    'AVAXUSDT': 35,
    'LTCUSDT': 70,
  };
  
  const basePrice = priceMap[symbol] || 1000;
  const spread = basePrice * 0.001; // 0.1% spread
  
  // Generate bids (buy orders) - below base price
  const bids = [];
  for (let i = 0; i < limit; i++) {
    const price = basePrice - (spread * (i + 1) / limit);
    const quantity = Math.random() * 10 + 1;
    bids.push({
      price: parseFloat(price.toFixed(2)),
      quantity: parseFloat(quantity.toFixed(4)),
      total: parseFloat((price * quantity).toFixed(2)),
      cumulative: 0
    });
  }
  
  // Generate asks (sell orders) - above base price
  const asks = [];
  for (let i = 0; i < limit; i++) {
    const price = basePrice + (spread * (i + 1) / limit);
    const quantity = Math.random() * 10 + 1;
    asks.push({
      price: parseFloat(price.toFixed(2)),
      quantity: parseFloat(quantity.toFixed(4)),
      total: parseFloat((price * quantity).toFixed(2)),
      cumulative: 0
    });
  }
  
  // Calculate cumulative totals
  let cumulativeBids = 0;
  const bidsWithCumulative = bids.map(bid => {
    cumulativeBids += bid.total;
    return { ...bid, cumulative: cumulativeBids };
  });
  
  let cumulativeAsks = 0;
  const asksWithCumulative = asks.map(ask => {
    cumulativeAsks += ask.total;
    return { ...ask, cumulative: cumulativeAsks };
  });
  
  const bestBid = bidsWithCumulative[0]?.price || basePrice;
  const bestAsk = asksWithCumulative[0]?.price || basePrice + spread;
  const spreadValue = bestAsk - bestBid;
  const spreadPercent = (spreadValue / bestBid) * 100;
  
  return {
    success: true,
    data: {
      symbol: symbol,
      bids: bidsWithCumulative,
      asks: asksWithCumulative,
      spread: spreadValue,
      spreadPercent: spreadPercent,
      bestBid: bestBid,
      bestAsk: bestAsk,
      lastUpdateId: Date.now(),
      timestamp: Date.now(),
      isMock: true // Flag to indicate this is mock data
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, limit = 20 } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required (e.g., BTCUSDT)' });
    }

    // Convert symbol to Binance format (e.g., BTC -> BTCUSDT)
    const binanceSymbol = symbol.toUpperCase().endsWith('USDT') 
      ? symbol.toUpperCase() 
      : `${symbol.toUpperCase()}USDT`;

    console.log(`[Binance OrderBook] Fetching order book for ${binanceSymbol}`);

    // Fetch order book from Binance with timeout
    let response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      response = await fetch(
        `${BINANCE_API_BASE}/depth?symbol=${binanceSymbol}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Binance OrderBook] Fetch error:', fetchError);
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return res.status(504).json({
          success: false,
          error: 'Request timeout: Binance API did not respond in time'
        });
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Binance OrderBook] API error ${response.status}:`, errorText);
      
      // Handle 451 (Unavailable For Legal Reasons) - Geographic restriction
      if (response.status === 451) {
        console.log(`[Binance OrderBook] 451 error - Using fallback mock data for ${binanceSymbol}`);
        // Return mock orderbook data as fallback
        const mockData = generateMockOrderBook(binanceSymbol, limit);
        return res.status(200).json(mockData);
      }
      
      if (response.status === 400) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid symbol: ${binanceSymbol}. Symbol may not be available on Binance.` 
        });
      }
      return res.status(response.status).json({
        success: false,
        error: `Binance API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[Binance OrderBook] JSON parse error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Binance API response'
      });
    }

    if (!data || !data.bids || !data.asks) {
      console.error('[Binance OrderBook] Invalid response structure:', data);
      return res.status(500).json({
        success: false,
        error: 'Invalid order book data structure from Binance'
      });
    }

    // Format bids (buy orders) - highest price first
    const bids = (data.bids || []).map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      total: parseFloat(price) * parseFloat(quantity)
    }));

    // Format asks (sell orders) - lowest price first
    const asks = (data.asks || []).map(([price, quantity]) => ({
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      total: parseFloat(price) * parseFloat(quantity)
    }));

    // Calculate cumulative totals for depth visualization
    let cumulativeBids = 0;
    const bidsWithCumulative = bids.map(bid => {
      cumulativeBids += bid.total;
      return { ...bid, cumulative: cumulativeBids };
    });

    let cumulativeAsks = 0;
    const asksWithCumulative = asks.map(ask => {
      cumulativeAsks += ask.total;
      return { ...ask, cumulative: cumulativeAsks };
    });

    // Calculate spread
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        symbol: binanceSymbol,
        bids: bidsWithCumulative,
        asks: asksWithCumulative,
        spread: spread,
        spreadPercent: spreadPercent,
        bestBid: bestBid,
        bestAsk: bestAsk,
        lastUpdateId: data.lastUpdateId,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Binance Order Book API error:', error);
    
    // If it's a 451 or network error, try to return mock data
    if (error.message && error.message.includes('451')) {
      console.log(`[Binance OrderBook] Error contains 451 - Using fallback mock data`);
      const { symbol } = req.query;
      const binanceSymbol = symbol?.toUpperCase().endsWith('USDT') 
        ? symbol.toUpperCase() 
        : `${symbol?.toUpperCase()}USDT`;
      const mockData = generateMockOrderBook(binanceSymbol, req.query.limit || 20);
      return res.status(200).json(mockData);
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order book data'
    });
  }
}













