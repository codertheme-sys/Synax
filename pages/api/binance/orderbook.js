// pages/api/binance/orderbook.js - Binance Order Book API
// Fetches real-time order book data (bids/asks) from Binance

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

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
    try {
      response = await fetch(
        `${BINANCE_API_BASE}/depth?symbol=${binanceSymbol}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json'
          },
          // Add timeout
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );
    } catch (fetchError) {
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
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch order book data'
    });
  }
}













