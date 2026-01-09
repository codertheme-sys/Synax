// pages/api/dashboard/index.js - Fetch Dashboard Data
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth token kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    
    // Token'dan user bilgisini al
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = user.id;

    // 1. KPIs - Portfolio Value, 24h P&L, Cash Balance
    let portfolioValue = 0;
    let pnl24h = 0;
    let cashBalance = 0;

    // 2. Portfolio verileri - First update prices, then fetch
    let portfolio = [];
    try {
      // Update portfolio prices from price_history before fetching
      const { data: initialPortfolio, error: initialError } = await supabaseAdmin
        .from('portfolio')
        .select('*')
        .eq('user_id', userId);

      if (initialPortfolio && initialPortfolio.length > 0) {
        // Update each portfolio item with current prices
        const updatePromises = initialPortfolio.map(async (p) => {
          try {
            // Get current price from price_history
            const { data: priceData } = await supabaseAdmin
              .from('price_history')
              .select('price')
              .eq('asset_id', p.asset_id)
              .eq('asset_type', p.asset_type)
              .single();

            if (priceData && priceData.price) {
              const currentPrice = parseFloat(priceData.price);
              const quantity = parseFloat(p.quantity || 0);
              const averagePrice = parseFloat(p.average_price || 0);
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
                .eq('id', p.id);
            }
          } catch (err) {
            // Silently continue if price update fails
          }
        });

        await Promise.all(updatePromises);

        // Now fetch updated portfolio
        const { data: portfolioData, error: portfolioError } = await supabaseAdmin
          .from('portfolio')
          .select('*')
          .eq('user_id', userId);

        if (portfolioError) {
          console.error('Portfolio error:', portfolioError);
          portfolio = [];
        } else {
          portfolio = portfolioData || [];
        }
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      portfolio = [];
    }

    // Calculate KPIs from portfolio - only include items with quantity > 0
    portfolioValue = portfolio
      .filter(p => parseFloat(p.quantity || 0) > 0)
      .reduce((sum, p) => sum + parseFloat(p.total_value || 0), 0);
    pnl24h = portfolio
      .filter(p => parseFloat(p.quantity || 0) > 0)
      .reduce((sum, p) => sum + parseFloat(p.profit_loss || 0), 0);

    // 3. Recent Orders (son 10 işlem)
    let recentOrders = [];
    try {
      const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from('trading_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('Orders error:', ordersError);
        recentOrders = [];
      } else {
        recentOrders = ordersData || [];
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
      recentOrders = [];
    }

    // 4. Watchlist
    let watchlist = [];
    try {
      const { data: watchlistData, error: watchlistError } = await supabaseAdmin
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (watchlistError) {
        console.error('Watchlist error:', watchlistError);
        watchlist = [];
      } else {
        watchlist = watchlistData || [];
      }
    } catch (err) {
      console.error('Watchlist fetch error:', err);
      watchlist = [];
    }

    // 5. Open Positions (portfolio'dan pozitif quantity olanlar)
    const openPositions = (portfolio || []).filter(p => parseFloat(p.quantity) > 0);

    // 6. Earn Products Value - Get active subscriptions
    let earnProductsValue = 0;
    try {
      const { data: subscriptions } = await supabaseAdmin
        .from('earn_subscriptions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (subscriptions && subscriptions.length > 0) {
        earnProductsValue = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
      }
    } catch (err) {
      console.error('Error fetching earn subscriptions:', err);
    }

    // Get cash balance from profiles table
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('cash_balance')
        .eq('id', userId)
        .single();

      if (profile) {
        cashBalance = parseFloat(profile.cash_balance || 0);
      }
    } catch (err) {
      console.error('Error fetching cash balance:', err);
    }

    // 7. Watchlist with prices
    let watchlistWithPrices = [];
    if (watchlist && watchlist.length > 0) {
      try {
        const assetIds = watchlist.map(w => w.asset_id);
        const { data: priceHistory } = await supabaseAdmin
          .from('price_history')
          .select('*')
          .in('asset_id', assetIds);

        watchlistWithPrices = watchlist.map(w => {
          const price = priceHistory?.find(p => p.asset_id === w.asset_id);
          return {
            ...w,
            current_price: price ? parseFloat(price.price) : 0,
            price_change_24h: price ? parseFloat(price.price_change_24h || 0) : 0,
            price_change_percent_24h: price ? parseFloat(price.price_change_percent_24h || 0) : 0,
          };
        });
      } catch (err) {
        console.error('Price history fetch error:', err);
        watchlistWithPrices = watchlist.map(w => ({
          ...w,
          current_price: 0,
          price_change_24h: 0,
          price_change_percent_24h: 0,
        }));
      }
    }

    // 8. Alerts (active alerts)
    let alerts = [];
    try {
      const { data: alertsData } = await supabaseAdmin
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      alerts = alertsData || [];
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }

    // 9. Recent Deposits & Withdrawals
    let recentDeposits = [];
    let recentWithdrawals = [];
    try {
      const { data: depositsData } = await supabaseAdmin
        .from('deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: withdrawalsData } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      recentDeposits = depositsData || [];
      recentWithdrawals = withdrawalsData || [];
    } catch (err) {
      console.error('Error fetching deposits/withdrawals:', err);
    }

    // 10. Daily, MTD, YTD P&L calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPnL = (() => {
      try {
        // Get trades made today
        const todayTrades = recentOrders.filter(o => {
          const tradeDate = new Date(o.created_at);
          return tradeDate >= today;
        });
        // This is a placeholder - in real implementation, would track daily P&L separately
        return portfolio.length > 0 ? pnl24h * 0.1 : 0; // 10% of 24h P&L as approximation
      } catch (err) {
        return 0;
      }
    })();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const mtdPnL = (() => {
      try {
        const monthTrades = recentOrders.filter(o => {
          const tradeDate = new Date(o.created_at);
          return tradeDate >= monthStart;
        });
        // Simplified calculation
        return portfolio.length > 0 ? pnl24h * 3 : 0;
      } catch (err) {
        return 0;
      }
    })();

    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    yearStart.setHours(0, 0, 0, 0);
    const ytdPnL = (() => {
      try {
        const yearTrades = recentOrders.filter(o => {
          const tradeDate = new Date(o.created_at);
          return tradeDate >= yearStart;
        });
        // Simplified calculation - uses current portfolio P&L
        return pnl24h;
      } catch (err) {
        return 0;
      }
    })();

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          portfolioValue,
          pnl24h,
          cashBalance,
          dailyPnL,
          mtdPnL,
          ytdPnL,
        },
        portfolio: portfolio.filter(p => parseFloat(p.quantity || 0) > 0), // Only return items with quantity > 0
        holdings: portfolio.filter(p => parseFloat(p.quantity || 0) > 0), // Same as portfolio for compatibility
        recentOrders,
        watchlist: watchlistWithPrices,
        openPositions,
        earnProductsValue,
        alerts,
        recentDeposits,
        recentWithdrawals,
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    });
  }
}
