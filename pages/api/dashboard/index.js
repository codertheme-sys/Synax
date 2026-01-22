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

    // 2. Portfolio verileri - READ ONLY (no updates to reduce disk IO)
    // Updates are handled by separate cron job /api/dashboard/update-portfolio-prices
    let portfolio = [];
    try {
      const { data: portfolioData, error: portfolioError } = await supabaseAdmin
        .from('portfolio')
        .select('*')
        .eq('user_id', userId)
        .neq('asset_symbol', 'USDT')
        .neq('asset_id', 'USDT');

      if (portfolioError) {
        console.error('Portfolio error:', portfolioError);
        portfolio = [];
      } else {
        // Filter out USDT items
        portfolio = (portfolioData || []).filter(p => 
          p.asset_symbol?.toUpperCase() !== 'USDT' && p.asset_id?.toUpperCase() !== 'USDT'
        );
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      portfolio = [];
    }

    // Calculate Assets Value from portfolio - only include items with quantity > 0
    const assetsValue = portfolio
      .filter(p => parseFloat(p.quantity || 0) > 0)
      .reduce((sum, p) => sum + parseFloat(p.total_value || 0), 0);
    pnl24h = portfolio
      .filter(p => parseFloat(p.quantity || 0) > 0)
      .reduce((sum, p) => sum + parseFloat(p.profit_loss || 0), 0);

    // 3-4. Fetch Recent Orders and Watchlist in parallel to reduce queries
    let recentOrders = [];
    let watchlist = [];
    try {
      const [ordersResult, watchlistResult] = await Promise.all([
        supabaseAdmin
          .from('trading_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabaseAdmin
          .from('watchlist')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50) // Limit watchlist size
      ]);

      recentOrders = ordersResult.data || [];
      watchlist = watchlistResult.data || [];
    } catch (err) {
      console.error('Error fetching orders/watchlist:', err);
      recentOrders = [];
      watchlist = [];
    }

    // 5. Open Positions (portfolio'dan pozitif quantity olanlar, USDT hariç)
    const openPositions = (portfolio || []).filter(p => 
      parseFloat(p.quantity) > 0 && 
      p.asset_symbol?.toUpperCase() !== 'USDT' && 
      p.asset_id?.toUpperCase() !== 'USDT'
    );

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

    // Get cash balance from profiles table (use balance column, not cash_balance)
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (profile) {
        cashBalance = parseFloat(profile.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching cash balance:', err);
    }

    // Calculate Portfolio Value = Assets + Earn Products + Cash Balance
    portfolioValue = assetsValue + earnProductsValue + cashBalance;

    // 7. Watchlist with prices - OPTIMIZED: Only fetch if watchlist exists
    let watchlistWithPrices = [];
    if (watchlist && watchlist.length > 0) {
      try {
        const assetIds = watchlist.map(w => w.asset_id).filter(Boolean);
        if (assetIds.length > 0) {
          const { data: priceHistory } = await supabaseAdmin
            .from('price_history')
            .select('asset_id, asset_type, price, price_change_24h, price_change_percent_24h')
            .in('asset_id', assetIds)
            .limit(100); // Limit to prevent large queries

          const priceMap = new Map();
          if (priceHistory) {
            priceHistory.forEach(p => {
              priceMap.set(p.asset_id, p);
            });
          }

          watchlistWithPrices = watchlist.map(w => {
            const price = priceMap.get(w.asset_id);
            return {
              ...w,
              current_price: price ? parseFloat(price.price || 0) : 0,
              price_change_24h: price ? parseFloat(price.price_change_24h || 0) : 0,
              price_change_percent_24h: price ? parseFloat(price.price_change_percent_24h || 0) : 0,
            };
          });
        } else {
          watchlistWithPrices = watchlist.map(w => ({
            ...w,
            current_price: 0,
            price_change_24h: 0,
            price_change_percent_24h: 0,
          }));
        }
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

    // 9. Recent Deposits & Withdrawals - Fetch in parallel
    let recentDeposits = [];
    let recentWithdrawals = [];
    try {
      const [depositsResult, withdrawalsResult] = await Promise.all([
        supabaseAdmin
          .from('deposits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabaseAdmin
          .from('withdrawals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      recentDeposits = depositsResult.data || [];
      recentWithdrawals = withdrawalsResult.data || [];
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
        portfolio: portfolio.filter(p => 
          parseFloat(p.quantity || 0) > 0 && 
          p.asset_symbol?.toUpperCase() !== 'USDT' && 
          p.asset_id?.toUpperCase() !== 'USDT'
        ), // Exclude USDT - USDT should only be in balance, not portfolio
        holdings: portfolio.filter(p => 
          parseFloat(p.quantity || 0) > 0 && 
          p.asset_symbol?.toUpperCase() !== 'USDT' && 
          p.asset_id?.toUpperCase() !== 'USDT'
        ), // Exclude USDT - USDT should only be in balance, not portfolio
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
