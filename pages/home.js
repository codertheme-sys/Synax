import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const kpis = [
  { label: 'Portfolio Value', value: '$128,420', delta: '+2.4%', positive: true },
  { label: '24h P&L', value: '+$1,920', delta: '+1.5%', positive: true },
  { label: 'Cash Balance', value: '$12,800', delta: 'Ready', positive: true },
];

const holdings = [
  { symbol: 'BTC', name: 'Bitcoin', qty: '1.25', avg: '$42,100', price: '$51,200', pnl: '+21.6%', alloc: '42%' },
  { symbol: 'ETH', name: 'Ethereum', qty: '12', avg: '$2,180', price: '$2,740', pnl: '+25.7%', alloc: '28%' },
  { symbol: 'XAU', name: 'Gold', qty: '3.5 oz', avg: '$1,980', price: '$2,030', pnl: '+2.5%', alloc: '15%' },
  { symbol: 'SOL', name: 'Solana', qty: '85', avg: '$92', price: '$105', pnl: '+14.1%', alloc: '10%' },
];

const positions = [
  { symbol: 'BTCUSDT', side: 'Long', size: '0.8 BTC', entry: '$49,800', mark: '$51,200', pnl: '+$1,120', lev: '3x', liq: '$38,400' },
  { symbol: 'ETHUSDT', side: 'Short', size: '6 ETH', entry: '$2,820', mark: '$2,740', pnl: '+$480', lev: '2x', liq: '$3,520' },
  { symbol: 'XAUUSD', side: 'Long', size: '1.5 oz', entry: '$1,990', mark: '$2,030', pnl: '+$60', lev: '1x', liq: '—' },
];

const orders = [
  { time: '12:24', symbol: 'BTC', side: 'Buy', qty: '0.2 BTC', status: 'Filled' },
  { time: '11:58', symbol: 'ETH', side: 'Sell', qty: '3 ETH', status: 'Partial' },
  { time: '11:15', symbol: 'SOL', side: 'Buy', qty: '25 SOL', status: 'Open' },
];

const watchlist = [
  { symbol: 'BTC', price: '$51,200', change: '+2.1%' },
  { symbol: 'ETH', price: '$2,740', change: '+1.5%' },
  { symbol: 'SOL', price: '$105.2', change: '+3.8%' },
  { symbol: 'XAU', price: '$2,030', change: '+0.4%' },
];

// Removed static alerts array - now using state from API

const news = [
  { title: 'BTC holds 51k as inflows stay positive', tag: 'Market' },
  { title: 'ETH upgrade timeline confirmed', tag: 'Tech' },
  { title: 'Gold steady despite USD strength', tag: 'Commodities' },
];

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Dashboard data states
  const [kpis, setKpis] = useState([
    { label: 'Portfolio Value', value: '$0', delta: '0%', positive: true },
    { label: '24h P&L', value: '$0', delta: '0%', positive: true },
    { label: 'Cash Balance', value: '$0', delta: 'Ready', positive: true },
  ]);
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [news, setNews] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [earnProducts, setEarnProducts] = useState([]);
  const [converts, setConverts] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [cancelSubscriptionProduct, setCancelSubscriptionProduct] = useState(null);
  const [depositCoin, setDepositCoin] = useState('');
  const [depositNetwork, setDepositNetwork] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReceipt, setDepositReceipt] = useState(null);
  const [withdrawCoin, setWithdrawCoin] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [kycStatus, setKycStatus] = useState('pending');

  const coins = ['USDT', 'BTC', 'ETH'];
  const networks = {
    USDT: ['Ethereum (ERC20)', 'Tron (TRC20)', 'Polygon', 'BSC (BEP20)'],
    BTC: ['Bitcoin', 'Lightning Network'],
    ETH: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Update portfolio prices first (in background, don't wait)
      fetch('/api/dashboard/update-portfolio-prices', { method: 'POST' }).catch(err => {
        console.error('Failed to update portfolio prices:', err);
      });
      try {
        setLoading(true);
        
        // Check authentication
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        setProfileEmail(currentUser.email || '');
        
        // Get profile data including KYC status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, kyc_status, kyc_verified')
          .eq('id', currentUser.id)
          .single();
        
        if (profileData) {
          setProfileUsername(profileData.full_name || '');
          setKycStatus(profileData.kyc_status || 'pending');
        }
        
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error('Session expired. Please login again.');
          router.push('/login');
          return;
        }

        // Fetch dashboard data from API
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Dashboard API error:', result);
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        console.log('Dashboard API response:', result);
        
        if (result.success && result.data) {
          const data = result.data;
          
          // Store dashboard data for performance section
          setDashboardData(data);
          
          // Update KPIs
          const portfolioValue = data.kpis?.portfolioValue || 0;
          const pnl24h = data.kpis?.pnl24h || 0;
          const pnl24hPercent = data.kpis?.pnl24hPercent || 0;
          const cashBalance = data.kpis?.cashBalance || 0;
          
          setKpis([
            { 
              label: 'Portfolio Value', 
              value: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              delta: `${pnl24hPercent >= 0 ? '+' : ''}${pnl24hPercent.toFixed(2)}%`, 
              positive: pnl24hPercent >= 0 
            },
            { 
              label: '24h P&L', 
              value: `${pnl24h >= 0 ? '+' : ''}$${Math.abs(pnl24h).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              delta: `${pnl24hPercent >= 0 ? '+' : ''}${pnl24hPercent.toFixed(2)}%`, 
              positive: pnl24h >= 0 
            },
            { 
              label: 'Cash Balance', 
              value: `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              delta: 'Ready', 
              positive: true 
            },
          ]);

          // Format holdings
          const formattedHoldings = (data.holdings || []).map(h => {
            const qty = parseFloat(h.quantity || 0);
            const avgPrice = parseFloat(h.average_price || 0);
            const currentPrice = parseFloat(h.current_price || 0);
            const pnl = parseFloat(h.profit_loss_percent || 0);
            const totalValue = parseFloat(h.total_value || 0);
            const portfolioTotal = portfolioValue || 1;
            const allocation = (totalValue / portfolioTotal) * 100;

            return {
              symbol: h.asset_symbol,
              name: h.asset_name,
              qty: h.asset_type === 'gold' ? `${qty.toFixed(2)} oz` : qty.toFixed(8),
              avg: `$${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              price: `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              pnl: `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`,
              alloc: `${allocation.toFixed(1)}%`,
            };
          });
          setHoldings(formattedHoldings);

          // Format positions from portfolio (for Open Positions section)
          const formattedPositions = (data.openPositions || []).map(p => {
            const qty = parseFloat(p.quantity || 0);
            const avgPrice = parseFloat(p.average_price || 0);
            const currentPrice = parseFloat(p.current_price || 0);
            const pnl = parseFloat(p.profit_loss || 0);
            const pnlPercent = parseFloat(p.profit_loss_percent || 0);
            
            return {
              symbol: p.asset_symbol,
              side: 'Long', // All positions are long (buy positions)
              size: p.asset_type === 'gold' ? `${qty.toFixed(2)} oz` : `${qty.toFixed(8)} ${p.asset_symbol}`,
              entry: `$${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              pnl: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`,
            };
          });
          setPositions(formattedPositions);

          // Fetch binary trades for recent trades
          const { data: binaryTradesData } = await supabase
            .from('binary_trades')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10);

          // Format recent trades (binary trades)
          const formattedOrders = (binaryTradesData || []).map(o => {
            const date = new Date(o.created_at);
            const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            return {
              time,
              symbol: o.asset_symbol,
              side: o.side === 'buy' ? 'LONG' : 'SHORT',
              qty: `$${parseFloat(o.trade_amount || 0).toFixed(2)}`,
              initialPrice: `$${parseFloat(o.initial_price || 0).toFixed(2)}`,
              lastPrice: o.last_price ? `$${parseFloat(o.last_price).toFixed(2)}` : '—',
              winLost: o.win_lost ? o.win_lost.toUpperCase() : '—',
              status: o.admin_status === 'approved' ? 'Approved' : o.admin_status === 'rejected' ? 'Rejected' : 'Pending',
            };
          });
          setOrders(formattedOrders);

          // Format watchlist
          const formattedWatchlist = (data.watchlist || []).map(w => {
            const price = parseFloat(w.current_price || 0);
            const change = parseFloat(w.price_change_percent_24h || 0);
            return {
              symbol: w.asset_symbol,
              price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            };
          });
          setWatchlist(formattedWatchlist);

          // Get profile username if available
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', currentUser.id)
            .single();
          
          if (profileData?.full_name) {
            setProfileUsername(profileData.full_name);
          }

          // Fetch recent deposits and withdrawals
          const [depositsResult, withdrawalsResult] = await Promise.all([
            supabase
              .from('deposits')
              .select('*')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('withdrawals')
              .select('*')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false })
              .limit(10)
          ]);
          
          if (depositsResult.data) {
            setRecentDeposits(depositsResult.data);
          }
          
          if (withdrawalsResult.data) {
            setRecentWithdrawals(withdrawalsResult.data);
          }
          
          // Combine deposits and withdrawals for Payment Monitor
          const combined = [
            ...(depositsResult.data || []).map(d => ({ ...d, type: 'deposit' })),
            ...(withdrawalsResult.data || []).map(w => ({ ...w, type: 'withdrawal' }))
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
          
          setAllPayments(combined);

          // Fetch alerts
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const alertsResponse = await fetch('/api/alerts/list', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              });
              const alertsResult = await alertsResponse.json();
              if (alertsResult.success) {
                setAlerts(alertsResult.data || []);
              }
            }
          } catch (err) {
            console.error('Error fetching alerts:', err);
          }

          // Fetch convert history
          try {
            const { data: convertData, error: convertError } = await supabase
              .from('convert_history')
              .select('*')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (convertError) {
              console.error('Error fetching convert history:', convertError);
            } else {
              setConverts(convertData || []);
            }
          } catch (err) {
            console.error('Error fetching convert history:', err);
          }

          // Fetch trade history (binary trades)
          try {
            const { data: tradesData, error: tradesError } = await supabase
              .from('binary_trades')
              .select('*')
              .eq('user_id', currentUser.id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(20);
            
            if (tradesError) {
              console.error('Error fetching trade history:', tradesError);
            } else {
              setTradeHistory(tradesData || []);
            }
          } catch (err) {
            console.error('Error fetching trade history:', err);
          }

          // Fetch user's subscribed earn products
          try {
            const { data: subscriptions, error: subError } = await supabase
              .from('earn_subscriptions')
              .select('*, earn_products(*)')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false });
            
            if (!subError && subscriptions) {
              // Map subscriptions to product format
              const subscribedProducts = subscriptions.map(sub => {
                const product = sub.earn_products || {};
                return {
                  subscriptionId: sub.id, // For cancellation
                  id: product.id || sub.id,
                  symbol: product.asset_symbol || product.asset || product.symbol || 'N/A',
                  apr: product.apr || '0%',
                  type: product.product_type === 'flexible' ? 'Flexible' : 'Locked',
                  days: product.duration_days || null,
                  duration: product.product_type === 'flexible' ? 'Flexible' : (product.duration_days ? `${product.duration_days} days` : 'N/A'),
                  amount: sub.amount || 0,
                  status: sub.status || 'active',
                  earnedAmount: sub.earned_amount || 0,
                  startDate: sub.start_date,
                  endDate: sub.end_date,
                  subscribedAt: sub.created_at
                };
              });
              setEarnProducts(subscribedProducts);
            } else {
              setEarnProducts([]);
            }
          } catch (err) {
            console.error('Error fetching subscribed earn products:', err);
            setEarnProducts([]);
          }
        } else {
          console.warn('Dashboard API returned unsuccessful response:', result);
          // Set default empty data
          setHoldings([]);
          setPositions([]);
          setOrders([]);
          setWatchlist([]);
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        toast.error('Failed to load dashboard data. Please try refreshing the page.');
        // Set default empty data on error
        setHoldings([]);
        setPositions([]);
        setOrders([]);
        setWatchlist([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchNews = async () => {
      try {
        // Using CoinDesk RSS feed via rss2json
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/');
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const formattedNews = data.items.slice(0, 5).map((item) => ({
            title: item.title || 'Crypto News',
            tag: 'Market',
            url: item.link || '#'
          }));
          setNews(formattedNews);
        } else {
          // Fallback news
          setNews([
            { title: 'BTC holds 51k as inflows stay positive', tag: 'Market', url: '#' },
            { title: 'ETH upgrade timeline confirmed', tag: 'Tech', url: '#' },
            { title: 'Gold steady despite USD strength', tag: 'Commodities', url: '#' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback news
        setNews([
          { title: 'BTC holds 51k as inflows stay positive', tag: 'Market', url: '#' },
          { title: 'ETH upgrade timeline confirmed', tag: 'Tech', url: '#' },
          { title: 'Gold steady despite USD strength', tag: 'Commodities', url: '#' },
        ]);
      }
    };

    fetchDashboardData();
    fetchNews();
    
    // Removed automatic refresh - user can manually refresh if needed
    // const refreshInterval = setInterval(() => {
    //   fetchDashboardData();
    // }, 30000); // 30 seconds
    
    // return () => clearInterval(refreshInterval);
  }, [router]);

  // Refresh KYC status when page becomes visible (user returns from admin panel)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Refresh KYC status when page becomes visible
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('kyc_status, kyc_verified')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Failed to fetch KYC status:', profileError);
          } else if (profileData) {
            console.log('KYC status refreshed:', profileData.kyc_status);
            setKycStatus(profileData.kyc_status || 'pending');
          }

          // Refresh deposits and withdrawals
          const [depositsResult, withdrawalsResult] = await Promise.all([
            supabase
              .from('deposits')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
              .from('withdrawals')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10)
          ]);
          
          if (depositsResult.data) {
            setRecentDeposits(depositsResult.data);
          }
          
          if (withdrawalsResult.data) {
            setRecentWithdrawals(withdrawalsResult.data);
          }
          
          // Combine deposits and withdrawals for Payment Monitor
          const combined = [
            ...(depositsResult.data || []).map(d => ({ ...d, type: 'deposit' })),
            ...(withdrawalsResult.data || []).map(w => ({ ...w, type: 'withdrawal' }))
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
          
          setAllPayments(combined);
        } catch (error) {
          console.error('Failed to refresh KYC status:', error);
        }
      }
    };

    // Also refresh on focus (when user switches back to tab)
    const handleFocus = async () => {
      if (user) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('kyc_status, kyc_verified')
            .eq('id', user.id)
            .single();
          
          if (profileData) {
            setKycStatus(profileData.kyc_status || 'pending');
          }
        } catch (error) {
          console.error('Failed to refresh KYC status on focus:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Also refresh deposits periodically (every 30 seconds) when page is visible
    const depositRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        supabase
          .from('deposits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data: deposits }) => {
            if (deposits) {
              setRecentDeposits(deposits);
              // Refresh withdrawals and combine
              supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)
                .then(({ data: withdrawals }) => {
                  if (withdrawals) {
                    setRecentWithdrawals(withdrawals);
                    // Combine deposits and withdrawals
                    const combined = [
                      ...(deposits || []).map(d => ({ ...d, type: 'deposit' })),
                      ...(withdrawals || []).map(w => ({ ...w, type: 'withdrawal' }))
                    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
                    setAllPayments(combined);
                  }
                })
                .catch(err => console.error('Failed to refresh withdrawals:', err));
            }
          })
          .catch(err => console.error('Failed to refresh deposits:', err));
      }
    }, 30000); // 30 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(depositRefreshInterval);
    };
  }, [user]);

  // Trigger scroll reveal animation after loading completes
  useEffect(() => {
    if (!loading) {
      // Wait for DOM to be ready, then trigger IntersectionObserver
      const timer = setTimeout(() => {
        const elements = Array.from(document.querySelectorAll('[data-reveal]'));
        
        // Check if elements are in viewport and reveal them
        const isInViewport = (el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        };

        // Reveal elements that are already in viewport
        elements.forEach((el) => {
          if (isInViewport(el)) {
            el.classList.add('reveal-show');
          }
        });

        // Create IntersectionObserver for elements not yet in viewport
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('reveal-show');
              }
            });
          },
          { threshold: 0.1 }
        );

        // Observe all elements
        elements.forEach((el) => {
          if (!el.classList.contains('reveal-show')) {
            observer.observe(el);
          }
        });

        return () => {
          elements.forEach((el) => observer.unobserve(el));
        };
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Alerts are now fetched from API and stored in state

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white flex flex-col items-center justify-center">
        <img src="/images/logo.png" alt="Synax" style={{ height: '100px', width: 'auto', marginBottom: '16px' }} />
        <div className="text-xl">Loading home...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-8 mb-8" data-reveal>
          <div style={{ width: '100%' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Your account overview
            </h1>
            <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
              Track balance, recent trades, positions and alerts at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center" style={{ 
            marginTop: '40px',
            paddingLeft: isMobile ? '16px' : '0',
            paddingRight: isMobile ? '16px' : '0',
            maxWidth: '100%',
            overflowX: isMobile ? 'auto' : 'visible'
          }}>
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              Profile
            </button>
            <Link
              href="/trade"
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              Trade
            </Link>
          </div>
        </div>

        {/* KPI Cards - Responsive Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-3 sm:gap-4`} data-reveal>
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                ...cardStyle,
                padding: '20px',
                transition: 'all 0.3s',
                border: '2px solid',
                borderImage: kpi.positive 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(59, 130, 246, 0.4)) 1'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(139, 92, 246, 0.4)) 1',
                boxShadow: kpi.positive
                  ? '0 0 20px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.05)'
                  : '0 0 20px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.05)',
              }}
              className="hover:-translate-y-2"
            >
              <p style={{ fontSize: isMobile ? '9px' : '11px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <span style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>{kpi.value}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: kpi.positive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                    color: kpi.positive ? '#4ade80' : '#f87171',
                    border: `1.5px solid ${kpi.positive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                    boxShadow: kpi.positive ? '0 0 10px rgba(34, 197, 94, 0.3)' : '0 0 10px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </div>



        {/* Performance & Alerts - Side by Side */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '16px' : '24px' }}
          data-reveal
        >
          <div
            style={{
              ...cardStyle,
              padding: '16px',
              border: '2px solid rgba(236, 72, 153, 0.3)',
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.15), inset 0 0 30px rgba(236, 72, 153, 0.05)',
            }}
            className="flex flex-col gap-4"
            data-reveal
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Performance</h2>
                <p className="text-gray-400 text-xs">Key metrics</p>
              </div>
            </div>

            {/* Metrics 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-gray-400 text-xs mb-1">Drawdown</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {dashboardData?.performance?.drawdown !== undefined 
                    ? (() => {
                        const drawdown = parseFloat(dashboardData.performance.drawdown) || 0;
                        return `${drawdown >= 0 ? '+' : ''}${drawdown.toFixed(2)}%`;
                      })()
                    : '0.00%'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-gray-400 text-xs mb-1">Volatility</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                  {dashboardData?.performance?.volatility !== undefined 
                    ? (() => {
                        const volatility = parseFloat(dashboardData.performance.volatility) || 0;
                        return `${volatility.toFixed(2)}%`;
                      })()
                    : '0.00%'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-gray-400 text-xs mb-1">Sharpe</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#4ade80' }}>
                  {dashboardData?.performance?.sharpe !== undefined 
                    ? (() => {
                        const sharpe = parseFloat(dashboardData.performance.sharpe) || 0;
                        return sharpe.toFixed(2);
                      })()
                    : '0.00'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-gray-400 text-xs mb-1">Win rate</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#4ade80' }}>
                  {dashboardData?.performance?.winRate !== undefined 
                    ? (() => {
                        const winRate = parseFloat(dashboardData.performance.winRate) || 0;
                        return `${winRate.toFixed(0)}%`;
                      })()
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Periodic PnL */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { 
                  label: 'Daily PnL', 
                  value: dashboardData?.performance?.dailyPnL !== undefined 
                    ? `${dashboardData.performance.dailyPnL >= 0 ? '+' : ''}$${Math.abs(dashboardData.performance.dailyPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$0.00',
                  positive: (dashboardData?.performance?.dailyPnL || 0) >= 0 
                },
                { 
                  label: 'MTD PnL', 
                  value: dashboardData?.performance?.mtdPnL !== undefined 
                    ? `${dashboardData.performance.mtdPnL >= 0 ? '+' : ''}$${Math.abs(dashboardData.performance.mtdPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$0.00',
                  positive: (dashboardData?.performance?.mtdPnL || 0) >= 0 
                },
                { 
                  label: 'YTD PnL', 
                  value: dashboardData?.performance?.ytdPnL !== undefined 
                    ? `${dashboardData.performance.ytdPnL >= 0 ? '+' : ''}$${Math.abs(dashboardData.performance.ytdPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '$0.00',
                  positive: (dashboardData?.performance?.ytdPnL || 0) >= 0 
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  className="hover:bg-white/10 transition-colors"
                  data-reveal
                >
                  <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                  <p
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: item.positive ? '#4ade80' : '#f87171',
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.15), inset 0 0 30px rgba(139, 92, 246, 0.05)',
          }} className="flex flex-col gap-3" data-reveal>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Converts History</h2>
            </div>
            <div className="space-y-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {converts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                  No convert operations yet. Convert your coins to USDT from the Assets page.
                </div>
              ) : (
                converts.map((c) => {
                  const date = new Date(c.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>{c.asset_symbol} → USDT</span>
                        <span style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          border: '1px solid',
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#4ade80',
                          borderColor: 'rgba(34, 197, 94, 0.4)',
                          boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)'
                        }}>
                          Converted
                        </span>
                      </div>
                      <div style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 500 }}>
                        {parseFloat(c.quantity).toFixed(8)} {c.asset_symbol} → ${parseFloat(c.usd_value).toFixed(2)} USDT
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>
                        {formattedDate} {formattedTime}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Watchlist & Recent Orders - Side by Side */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '16px' : '24px' }}
          data-reveal
        >
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.15), inset 0 0 30px rgba(59, 130, 246, 0.05)',
            height: '350px',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            width: isMobile ? '100%' : 'auto',
            overflow: 'hidden',
          }} data-reveal>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Trade History</h2>
              <span className="text-xs text-gray-400">Completed trades</span>
            </div>
            <div className="space-y-2" style={{ 
              flex: 1, 
              overflowY: 'auto',
              maxWidth: '100%',
              wordWrap: 'break-word',
            }}>
              {tradeHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                  No trade history yet. Start trading to see your completed trades here.
                </div>
              ) : (
                tradeHistory.map((trade) => {
                  const date = new Date(trade.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const tradeAmount = parseFloat(trade.trade_amount || 0);
                  const profitPercentage = parseFloat(trade.potential_profit_percentage || 0);
                  const profitAmount = trade.win_lost === 'win' 
                    ? tradeAmount + (tradeAmount * profitPercentage / 100)
                    : tradeAmount - (tradeAmount * profitPercentage / 100);
                  
                  return (
                    <div
                      key={trade.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '10px 12px',
                        transition: 'all 0.2s ease',
                        maxWidth: '100%',
                        overflow: 'hidden',
                      }}
                      data-reveal
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: '#ffffff', 
                          fontSize: isMobile ? '12px' : '13px',
                          wordBreak: 'break-word'
                        }}>{trade.asset_symbol} {trade.side === 'buy' ? 'LONG' : 'SHORT'}</span>
                        <span style={{
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 600,
                          color: trade.win_lost === 'win' ? '#4ade80' : '#f87171',
                          whiteSpace: 'nowrap',
                        }}>
                          {trade.win_lost ? trade.win_lost.toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}>
                        <div style={{ 
                          color: '#d1d5db', 
                          fontSize: isMobile ? '11px' : '12px', 
                          fontWeight: 500,
                          wordBreak: 'break-word'
                        }}>
                          Amount: ${tradeAmount.toFixed(2)}
                        </div>
                        <div style={{ 
                          color: trade.win_lost === 'win' ? '#4ade80' : '#f87171', 
                          fontSize: isMobile ? '11px' : '12px', 
                          fontWeight: 600,
                        }}>
                          {trade.win_lost === 'win' ? '+' : '-'}${Math.abs(profitAmount - tradeAmount).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '11px', 
                        marginTop: '4px'
                      }}>
                        {formattedDate} {formattedTime}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.15), inset 0 0 30px rgba(34, 197, 94, 0.05)',
            maxWidth: '100%',
            overflow: 'hidden',
          }} className="flex flex-col gap-3" data-reveal>
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700 }}>Recent Trades</h2>
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <div className="overflow-x-auto" style={{ 
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table className="min-w-full" style={{ 
                borderCollapse: 'collapse',
                width: isMobile ? 'max-content' : '100%',
                minWidth: isMobile ? '600px' : 'auto'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Time</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Symbol</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Side</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Amount</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Initial</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Last</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Win/Lost</th>
                    <th style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '9px' : '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'left', whiteSpace: 'nowrap' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', fontWeight: 600 }}>
                        No recent trades. Start trading to see your trade history here.
                        <Link href="/trade" style={{ 
                          display: 'block', 
                          marginTop: '12px', 
                          color: '#4ade80', 
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          Go to Trade →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < orders.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '10px' : '11px', color: '#d1d5db', fontWeight: 600, whiteSpace: 'nowrap' }}>{o.time}</td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '11px' : '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap' }}>{o.symbol}</td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px' }}>
                          <span style={{
                            fontSize: isMobile ? '9px' : '10px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            background: o.side === 'LONG' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: o.side === 'LONG' ? '#4ade80' : '#f87171',
                            border: `1px solid ${o.side === 'LONG' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                          }}>
                            {o.side}
                          </span>
                        </td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '10px' : '11px', color: '#d1d5db', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.qty}</td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '10px' : '11px', color: '#ffffff', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.initialPrice || '—'}</td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px', fontSize: isMobile ? '10px' : '11px', color: '#ffffff', fontWeight: 500, whiteSpace: 'nowrap' }}>{o.lastPrice || '—'}</td>
                        <td style={{ padding: isMobile ? '6px 4px' : '8px' }}>
                          {o.winLost && o.winLost !== '—' ? (
                            <span style={{
                              fontSize: isMobile ? '9px' : '10px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background: o.winLost === 'WIN' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: o.winLost === 'WIN' ? '#4ade80' : '#f87171',
                              border: `1px solid ${o.winLost === 'WIN' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            }}>
                              {o.winLost}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            border: '1px solid',
                            background: o.status === 'Approved'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : o.status === 'Rejected'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(251, 191, 36, 0.2)',
                            color: o.status === 'Approved'
                              ? '#4ade80'
                              : o.status === 'Rejected'
                              ? '#f87171'
                              : '#fbbf24',
                            borderColor: o.status === 'Approved'
                              ? 'rgba(34, 197, 94, 0.4)'
                              : o.status === 'Rejected'
                              ? 'rgba(239, 68, 68, 0.4)'
                              : 'rgba(251, 191, 36, 0.4)',
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-500 text-center pt-4" data-reveal>
          Demo data shown for layout preview. Live data wiring comes next.
        </p>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowDepositModal(false)}
        >
          <div
            style={{
              ...cardStyle,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Deposit crypto from your external wallet</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton?.disabled) return; // Prevent double submit
                
                try {
                  // Disable form to prevent double submission
                  if (submitButton) submitButton.disabled = true;
                  
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) {
                    toast.error('Please login again');
                    if (submitButton) submitButton.disabled = false;
                    return;
                  }

                  // Upload receipt via API (bypasses RLS using service role)
                  let receiptUrl = null;
                  if (depositReceipt) {
                    try {
                      console.log('Uploading deposit receipt via API...');
                      // Convert file to base64
                      const reader = new FileReader();
                      const fileBase64Promise = new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(depositReceipt);
                      });

                      const fileBase64 = await fileBase64Promise;

                      // Upload via API endpoint (uses service role, bypasses RLS)
                      const uploadResponse = await fetch('/api/deposit/upload-receipt', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: session.user.id,
                          file_base64: fileBase64,
                          file_name: depositReceipt.name,
                          file_type: depositReceipt.type || 'image/jpeg',
                        }),
                      });

                      if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        console.error('Receipt upload API error:', errorData);
                        toast.error(`Failed to upload receipt: ${errorData.error || 'Unknown error'}`);
                        receiptUrl = null; // Ensure it's null on error
                      } else {
                        const result = await uploadResponse.json();
                        if (result.success && result.receipt_url) {
                          receiptUrl = result.receipt_url;
                          console.log('Receipt uploaded successfully via API:', receiptUrl);
                        } else {
                          console.error('Receipt upload response missing receipt_url:', result);
                          toast.error('Receipt upload succeeded but URL not returned');
                          receiptUrl = null;
                        }
                      }
                    } catch (uploadErr) {
                      console.error('Receipt upload exception:', uploadErr);
                      toast.error('Failed to upload receipt. Please try again.');
                    }
                  }

                  // Create deposit request
                  console.log('Creating deposit with receipt_url:', receiptUrl);
                  const response = await fetch('/api/deposit/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      coin: depositCoin,
                      network: depositNetwork,
                      amount: parseFloat(depositAmount),
                      receipt_url: receiptUrl,
                    }),
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success('Deposit request submitted successfully!');
                setShowDepositModal(false);
                    setDepositCoin('');
                    setDepositNetwork('');
                    setDepositAmount('');
                    setDepositReceipt(null);
                    // Refresh dashboard data
                    window.location.reload();
                  } else {
                    throw new Error(result.error || 'Failed to submit deposit');
                  }
                } catch (error) {
                  console.error('Deposit error:', error);
                  toast.error(error.message || 'Failed to submit deposit request. Please try again.');
                } finally {
                  // Re-enable form
                  const form = e.target;
                  const submitButton = form.querySelector('button[type="submit"]');
                  if (submitButton) submitButton.disabled = false;
                }
              }}
              className="space-y-4"
            >
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  SELECT COIN *
                </label>
                <select
                  value={depositCoin}
                  onChange={(e) => {
                    setDepositCoin(e.target.value);
                    setDepositNetwork('');
                  }}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(15, 17, 36, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                >
                  <option value="" style={{ background: '#0f1124', color: '#ffffff' }}>Select a coin</option>
                  {coins.map((coin) => (
                    <option key={coin} value={coin} style={{ background: '#0f1124', color: '#ffffff' }}>
                      {coin}
                    </option>
                  ))}
                </select>
              </div>
              {depositCoin && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                    SELECT NETWORK *
                  </label>
                  <select
                    value={depositNetwork}
                    onChange={(e) => {
                      setDepositNetwork(e.target.value);
                      // Clear custom validity when user selects
                      e.target.setCustomValidity('');
                    }}
                    onInvalid={(e) => {
                      e.preventDefault();
                      e.target.setCustomValidity('Please select a network');
                      toast.error('Please select a network', {
                        duration: 3000,
                        style: {
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                          border: '2px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '14px',
                          padding: '18px 24px',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#ffffff',
                          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
                          backdropFilter: 'blur(10px)',
                        },
                        icon: '⚠️',
                      });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(15, 17, 36, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  >
                    <option value="" style={{ background: '#0f1124', color: '#ffffff' }}>Select a network</option>
                    {networks[depositCoin]?.map((network) => (
                      <option key={network} value={network} style={{ background: '#0f1124', color: '#ffffff' }}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Amount ($) *
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Transaction receipt *
                </label>
                <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDepositReceipt(e.target.files[0])}
                  required
                    id="deposit-receipt-input"
                  style={{
                      position: 'absolute',
                      opacity: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                  <label
                    htmlFor="deposit-receipt-input"
                    style={{
                      display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {depositReceipt ? depositReceipt.name : 'Select File'}
                  </label>
                </div>
                {!depositReceipt && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>No file selected</p>
                )}
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            style={{
              ...cardStyle,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Withdraw crypto to your external wallet</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) {
                    toast.error('Please login again');
                    return;
                  }

                  const response = await fetch('/api/withdraw/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      coin: withdrawCoin,
                      network: withdrawNetwork,
                      address: withdrawAddress,
                      amount: parseFloat(withdrawAmount),
                    }),
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                    toast.success('Withdrawal request submitted successfully! Your withdrawal request will be processed within 24 hours.', {
                      duration: 5000,
                      style: {
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }
                    });
                setShowWithdrawModal(false);
                    setWithdrawCoin('');
                    setWithdrawNetwork('');
                    setWithdrawAddress('');
                    setWithdrawAmount('');
                    // Refresh dashboard data
                    window.location.reload();
                  } else {
                    throw new Error(result.error || 'Failed to submit withdrawal');
                  }
                } catch (error) {
                  console.error('Withdrawal error:', error);
                  toast.error(error.message || 'Failed to submit withdrawal request. Please try again.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  SELECT COIN *
                </label>
                <select
                  value={withdrawCoin}
                  onChange={(e) => setWithdrawCoin(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                >
                  <option value="" style={{ background: '#0f1124', color: '#ffffff' }}>Select a coin</option>
                  {coins.map((coin) => (
                    <option key={coin} value={coin} style={{ background: '#0f1124', color: '#ffffff' }}>
                      {coin}
                    </option>
                  ))}
                </select>
              </div>
              {withdrawCoin && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                    SELECT NETWORK *
                  </label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(15, 17, 36, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  >
                    <option value="" style={{ background: '#0f1124', color: '#ffffff' }}>Select a network</option>
                    {networks[withdrawCoin]?.map((network) => (
                      <option key={network} value={network} style={{ background: '#0f1124', color: '#ffffff' }}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  step="0.00000001"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Wallet Address *
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  placeholder="Enter wallet address"
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelSubscriptionModal && cancelSubscriptionProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => {
            setShowCancelSubscriptionModal(false);
            setCancelSubscriptionProduct(null);
          }}
        >
          <div
            style={{
              ...cardStyle,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Cancel Subscription</h2>
              <button
                onClick={() => {
                  setShowCancelSubscriptionModal(false);
                  setCancelSubscriptionProduct(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '16px', color: '#d1d5db', marginBottom: '16px', lineHeight: '1.6' }}>
                Are you sure you want to cancel this <strong style={{ color: '#ffffff' }}>{cancelSubscriptionProduct.type === 'Flexible' ? 'flexible' : 'locked'}</strong> subscription for <strong style={{ color: '#ffffff' }}>{cancelSubscriptionProduct.symbol}</strong>?
              </p>
              
              {cancelSubscriptionProduct.type === 'Locked' ? (
                <div style={{
                  padding: '16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 600, marginBottom: '8px' }}>
                    ⚠️ Early Cancellation Warning
                  </p>
                  <p style={{ fontSize: '13px', color: '#fcd34d', lineHeight: '1.5' }}>
                    This is a locked subscription. Early cancellation may result in <strong>no earnings</strong>. You will only receive your principal amount back.
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '14px', color: '#4ade80', fontWeight: 600, marginBottom: '8px' }}>
                    ℹ️ Proportional Earnings
                  </p>
                  <p style={{ fontSize: '13px', color: '#86efac', lineHeight: '1.5' }}>
                    This is a flexible subscription. You will receive <strong>proportional earnings</strong> based on the time you've held the subscription.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCancelSubscriptionModal(false);
                  setCancelSubscriptionProduct(null);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      toast.error('Please log in again');
                      return;
                    }

                    const response = await fetch('/api/earn/cancel', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({
                        subscriptionId: cancelSubscriptionProduct.subscriptionId
                      })
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                      throw new Error(result.error || 'Failed to cancel subscription');
                    }

                    // Close modal first
                    setShowCancelSubscriptionModal(false);
                    setCancelSubscriptionProduct(null);

                    // Show success toast
                    if (result.earnedAmount > 0) {
                      toast.success(`Subscription cancelled successfully! Earned: $${result.earnedAmount.toFixed(2)}`, {
                        duration: 5000,
                        style: {
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          color: '#4ade80',
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: 600,
                        }
                      });
                    } else {
                      toast.success('Subscription cancelled successfully. No earnings due to early cancellation.', {
                        duration: 5000,
                        style: {
                          background: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          color: '#fbbf24',
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: 600,
                        }
                      });
                    }
                    
                    // Refresh dashboard data
                    window.location.reload();
                  } catch (error) {
                    console.error('Cancel error:', error);
                    toast.error(error.message || 'Failed to cancel subscription', {
                      duration: 5000,
                      style: {
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: 600,
                      }
                    });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              ...cardStyle,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Profile Settings</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Update profile in Supabase
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session?.user) {
                    const { error } = await supabase
                      .from('profiles')
                      .update({
                        full_name: profileUsername,
                      })
                      .eq('id', session.user.id);
                    
                    if (error) throw error;
                    
                    toast.success('Profile updated successfully!');
                setShowProfileModal(false);
                  }
                } catch (error) {
                  console.error('Profile update error:', error);
                  toast.error('Failed to update profile. Please try again.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  KYC Status
                </label>
                <div style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{kycStatus || 'pending'}</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: kycStatus === 'approved' ? 'rgba(34, 197, 94, 0.15)' : kycStatus === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                    color: kycStatus === 'approved' ? '#4ade80' : kycStatus === 'rejected' ? '#f87171' : '#fbbf24',
                  }}>
                    {kycStatus === 'approved' ? 'Verified' : kycStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Two-Factor Authentication
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#d1d5db' }}>Enable 2FA for enhanced security</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Notification Preferences
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '14px', color: '#d1d5db' }}>Email notifications</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '14px', color: '#d1d5db' }}>Price alerts</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '14px', color: '#d1d5db' }}>Trade confirmations</span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
