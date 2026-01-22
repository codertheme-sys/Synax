import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function AssetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Data states
  const [holdings, setHoldings] = useState([]);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [earnProducts, setEarnProducts] = useState([]);
  
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [convertAmount, setConvertAmount] = useState('');
  const [convertUsdValue, setConvertUsdValue] = useState(0);
  const [depositCoin, setDepositCoin] = useState('');
  const [depositNetwork, setDepositNetwork] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReceipt, setDepositReceipt] = useState(null);
  const [withdrawCoin, setWithdrawCoin] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  const coins = ['USDT', 'BTC', 'ETH'];
  const networks = {
    USDT: ['Tron (TRC20)'],
    BTC: ['Bitcoin Network'],
    ETH: ['Ethereum (ERC20)'],
  };

  // Payment information for deposits
  const paymentInfo = {
    'USDT': {
      'Tron (TRC20)': {
        address: 'TFieCTCx9UxXEeB1Bu977jKCurxDxLPXXP',
        network: 'Tron (TRC-20)',
        qrCode: '/images/usdt-qr.png',
      },
    },
    'ETH': {
      'Ethereum (ERC20)': {
        address: '0x6fb2603489e0fc38bb90bef6618b44d28b301a1b',
        network: 'ERC-20',
        qrCode: '/images/eth-qr-new.png', // New QR code file name to bypass cache
      },
    },
    'BTC': {
      'Bitcoin Network': {
        address: 'bc1qwdryv20f84ymsg8qltahfumlyvpkdgk9cv7jma5m9j9a82l3japsfrapqg',
        network: 'BTC',
        qrCode: '/images/btc-qr.png',
      },
    },
  };

  const getPaymentInfo = () => {
    if (!depositCoin || !depositNetwork) return null;
    return paymentInfo[depositCoin]?.[depositNetwork] || null;
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);

        // Fetch dashboard data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        let response;
        try {
          response = await fetch('/api/dashboard', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error('Dashboard API timeout (15s)');
            toast.error('Request timeout. Please try again.');
            setLoading(false);
            return;
          }
          throw fetchError;
        }

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const data = result.data;

            // Format holdings
            const portfolioValue = data.kpis?.portfolioValue || 0;
            const formattedHoldings = (data.holdings || []).map(h => {
              const qty = parseFloat(h.quantity || 0);
              const avgPrice = parseFloat(h.average_price || 0);
              const currentPrice = parseFloat(h.current_price || 0);
              const pnl = parseFloat(h.profit_loss_percent || 0);
              const totalValue = parseFloat(h.total_value || 0);
              const portfolioTotal = portfolioValue || 1;
              const allocation = (totalValue / portfolioTotal) * 100;

              return {
                id: h.id,
                asset_id: h.asset_id,
                asset_type: h.asset_type,
                symbol: h.asset_symbol,
                name: h.asset_name,
                quantity: qty,
                qty: h.asset_type === 'gold' ? `${qty.toFixed(2)} oz` : qty.toFixed(8),
                avg: `$${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                price: `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                currentPrice: currentPrice,
                pnl: `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`,
                alloc: `${allocation.toFixed(1)}%`,
                totalValue: totalValue,
              };
            });
            setHoldings(formattedHoldings);

            // Fetch recent deposits and withdrawals
            const [depositsResult, withdrawalsResult] = await Promise.all([
              supabase
                .from('deposits')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10),
              supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', session.user.id)
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

            // Fetch user's subscribed earn products
            try {
              const { data: subscriptions, error: subError } = await supabase
                .from('earn_subscriptions')
                .select('*, earn_products(*)')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
              
              if (!subError && subscriptions) {
                const subscribedProducts = subscriptions.map(sub => {
                  const product = sub.earn_products || {};
                  return {
                    subscriptionId: sub.id,
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
          }
        }
      } catch (error) {
        console.error('Error fetching assets data:', error);
        toast.error('Failed to load assets data');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0b0c1a 0%, #11142d 50%, #0b0c1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <img
          src="/images/logo.png"
          alt="Synax"
          style={{ width: '96px', height: 'auto', opacity: 0.9 }}
        />
        <div className="text-xl" style={{ fontSize: '22px', fontWeight: 700 }}>
          Loading assets...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0c1a 0%, #11142d 50%, #0b0c1a 100%)',
    }}>
      <Header />
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        paddingTop: '120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDepositModal(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            Withdraw
          </button>
        </div>

        {/* Holdings, Payment Monitor, Earn Products - Grid Layout */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '24px',
        }}>
        {/* Holdings Section */}
        <div style={{ 
          width: '100%', 
          display: 'block', 
          visibility: 'visible',
          opacity: 1,
          height: '400px',
          overflow: 'hidden',
        }}>
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.15), inset 0 0 30px rgba(59, 130, 246, 0.05)',
            visibility: 'visible',
            opacity: 1,
            display: 'block',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Holdings</h2>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 17, 36, 0.95)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '0', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Asset</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Qty</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Price</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>P&amp;L%</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Alloc</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Convert</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                          No holdings yet. Start trading to see your assets here.
                        </div>
                        <Link href="/trade" style={{ 
                          display: 'inline-block', 
                          marginTop: '12px', 
                          color: '#60a5fa', 
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}>
                          Go to Trade →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    holdings.map((h, idx) => (
                    <tr
                      key={h.symbol}
                      style={{
                        borderBottom: idx < holdings.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '0', paddingRight: '12px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                        <span style={{ fontWeight: 700 }}>{h.symbol}</span>
                      </td>
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px', fontSize: '12px', color: '#d1d5db', fontWeight: 500 }}>{h.qty}</td>
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{h.price}</td>
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px', fontSize: '13px', fontWeight: 800, color: '#4ade80', textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}>{h.pnl}</td>
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{h.alloc}</td>
                      <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '12px' }}>
                        {/* Don't show convert button for USDT - USDT is already USDT */}
                        {h.symbol?.toUpperCase() !== 'USDT' && (
                          <button
                            onClick={() => {
                              setSelectedHolding(h);
                              setConvertAmount('');
                              setConvertUsdValue(0);
                              setShowConvertModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              border: '1px solid rgba(59, 130, 246, 0.5)',
                              color: '#60a5fa',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                            }}
                          >
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Monitor Section */}
        <div style={{ 
          width: '100%', 
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          height: '400px',
          overflow: 'hidden',
        }}>
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.15), inset 0 0 30px rgba(34, 197, 94, 0.05)',
            visibility: 'visible',
            opacity: 1,
            display: 'block',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Payment Monitor</h2>
              <span className="text-xs text-gray-400">History</span>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 17, 36, 0.95)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid rgba(34, 197, 94, 0.3)' }}>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '0', paddingRight: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Type</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Coin</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Amount</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Status</th>
                    <th style={{ paddingTop: '8px', paddingBottom: '8px', paddingRight: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                          No payments yet. Make a deposit or withdrawal to see your history here.
                        </div>
                        <button
                          onClick={() => setShowDepositModal(true)}
                          style={{ 
                            display: 'inline-block', 
                            marginTop: '12px', 
                            color: '#4ade80', 
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          Make Deposit →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    allPayments.map((payment, idx) => {
                      const date = new Date(payment.created_at);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      
                      // Parse coin for deposits
                      let coin = 'N/A';
                      if (payment.type === 'deposit') {
                        if (payment.transaction_id) {
                          const coinNetwork = payment.transaction_id.split(':');
                          coin = coinNetwork[0] || payment.payment_provider || 'N/A';
                        } else {
                          coin = payment.payment_provider || 'N/A';
                        }
                      } else if (payment.type === 'withdrawal') {
                        if (payment.admin_notes && payment.admin_notes.includes('Coin:')) {
                          const coinMatch = payment.admin_notes.match(/Coin:\s*(\w+)/);
                          coin = coinMatch ? coinMatch[1] : 'N/A';
                        } else {
                          coin = payment.payment_method === 'crypto' ? 'Crypto' : 'USD';
                        }
                      }
                      
                      const status = payment.status || 'pending';
                      const isDeposit = payment.type === 'deposit';
                      
                      return (
                        <tr
                          key={`${payment.type}-${payment.id}`}
                          style={{
                            borderBottom: idx < allPayments.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDeposit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '0', paddingRight: '10px', fontSize: '12px', fontWeight: 700, color: isDeposit ? '#4ade80' : '#ef4444' }}>
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </td>
                          <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '0', paddingRight: '10px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                            {coin}
                          </td>
                          <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', fontSize: '12px', color: '#d1d5db', fontWeight: 500 }}>
                            ${parseFloat(payment.amount || 0).toFixed(8)}
                          </td>
                          <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', fontSize: '12px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                color: status === 'completed' ? '#4ade80' : status === 'rejected' ? '#f87171' : '#fbbf24',
                                border: `1px solid ${status === 'completed' ? 'rgba(34, 197, 94, 0.4)' : status === 'rejected' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
                              }}
                            >
                              {status === 'completed' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ paddingTop: '10px', paddingBottom: '10px', paddingRight: '10px', fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{formattedDate}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Earn Products Section */}
        <div style={{ 
          width: '100%', 
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          height: '400px',
          overflow: 'hidden',
        }}>
          <div style={{
            ...cardStyle,
            padding: '16px',
            border: '2px solid rgba(251, 191, 36, 0.3)',
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.15), inset 0 0 30px rgba(251, 191, 36, 0.05)',
            visibility: 'visible',
            opacity: 1,
            display: 'block',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Earn Products</h2>
              <span className="text-xs text-gray-400">Your subscriptions</span>
            </div>
            <div className="space-y-2" style={{ 
              maxHeight: '340px',
              overflowY: 'auto',
            }}>
              {earnProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                  No earn products subscribed. Visit the Earn page to subscribe.
                </div>
              ) : (
                earnProducts.map((product) => (
                  <div
                    key={product.subscriptionId || product.id}
                    style={{
                      background: product.status === 'cancelled' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      border: product.status === 'cancelled' ? '1px solid rgba(107, 114, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '10px 12px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (product.status !== 'cancelled') {
                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = product.status === 'cancelled' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = product.status === 'cancelled' ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: product.status === 'cancelled' ? '#9ca3af' : '#ffffff', fontSize: '13px' }}>
                        {product.symbol}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: product.status === 'cancelled' ? '#9ca3af' : '#fbbf24' }}>
                        {product.apr}% APR
                      </span>
                    </div>
                    <div style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 500 }}>
                      {product.type === 'Flexible' ? 'Flexible' : `${product.days || product.duration} days`} • ${parseFloat(product.amount).toFixed(2)} USDT
                    </div>
                    {product.earnedAmount > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>
                        Earned: ${parseFloat(product.earnedAmount).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        </section>
      </main>

      {/* Deposit Modal - Copy from home.js */}
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
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Deposit crypto to your account</h2>
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
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session?.access_token) {
                    toast.error('Please login again');
                    return;
                  }

                  // Upload receipt first (base64 via API)
                  let receiptUrl = null;
                  if (depositReceipt) {
                    try {
                      const reader = new FileReader();
                      const fileBase64Promise = new Promise((resolve, reject) => {
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(depositReceipt);
                      });

                      const fileBase64 = await fileBase64Promise;

                      if (!fileBase64 || typeof fileBase64 !== 'string' || fileBase64.length === 0) {
                        console.error('Receipt upload - Invalid file data after conversion (assets page)');
                        toast.error('Failed to process receipt file. Please try again.');
                        throw new Error('Invalid file data');
                      }

                      const uploadResponse = await fetch('/api/deposit/upload-receipt', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: session.user.id,
                          file_base64: fileBase64,
                          file_name: depositReceipt.name || 'receipt.jpg',
                          file_type: depositReceipt.type || 'image/jpeg',
                        }),
                      });

                      if (!uploadResponse.ok) {
                        let errorData;
                        try {
                          errorData = await uploadResponse.json();
                        } catch (parseError) {
                          errorData = { error: `Server error: ${uploadResponse.status} ${uploadResponse.statusText}` };
                        }
                        console.error('Receipt upload API error (assets):', errorData);
                        const errorMessage = errorData.error || errorData.details || 'Unknown error';
                        toast.error(`Failed to upload receipt: ${errorMessage}`);
                        throw new Error(`Receipt upload failed: ${errorMessage}`);
                      } else {
                        const result = await uploadResponse.json();
                        if (result.success && result.receipt_url) {
                          receiptUrl = result.receipt_url;
                        } else {
                          console.error('Receipt upload response missing receipt_url (assets):', result);
                          toast.error('Receipt upload succeeded but URL not returned');
                          throw new Error('Receipt upload succeeded but URL not returned');
                        }
                      }
                    } catch (uploadErr) {
                      console.error('Receipt upload exception (assets):', uploadErr);
                      throw uploadErr;
                    }
                  }

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
                    window.location.reload();
                  } else {
                    throw new Error(result.error || 'Failed to submit deposit');
                  }
                } catch (error) {
                  console.error('Deposit error:', error);
                  toast.error(error.message || 'Failed to submit deposit request. Please try again.');
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
                  className="deposit-select"
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
                    onChange={(e) => setDepositNetwork(e.target.value)}
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
                  className="deposit-select"
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
              
              {/* Payment Information Section */}
              {getPaymentInfo() && (
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  marginTop: '16px',
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>
                    Payment Information
                  </h3>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Coin</div>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{depositCoin}</div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Network</div>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{getPaymentInfo().network}</div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Wallet Address</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <div style={{ 
                        flex: 1, 
                        fontSize: '12px', 
                        color: '#ffffff',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                      }}>
                        {getPaymentInfo().address}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(getPaymentInfo().address);
                          toast.success('Wallet address copied!');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          color: '#60a5fa',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>QR Code</div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      <img
                        src={getPaymentInfo().qrCode}
                        alt={`${depositCoin} QR Code`}
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          width: '100%',
                          height: 'auto',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="color: #9ca3af; font-size: 12px; text-align: center; padding: 20px;">QR Code image not found</div>';
                        }}
                      />
                    </div>
                  </div>
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#fbbf24', textAlign: 'center' }}>
                      ⚠️ Please send only {depositCoin} to this address on {getPaymentInfo().network} network. Sending other coins may result in permanent loss.
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  {depositCoin ? `Amount (${depositCoin}) *` : 'Amount *'}
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  step={depositCoin === 'BTC' || depositCoin === 'ETH' ? '0.00000001' : depositCoin === 'USDT' ? '0.01' : '0.01'}
                  min="0"
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
                  placeholder={depositCoin === 'BTC' ? '0.00000000' : depositCoin === 'ETH' ? '0.00000000' : depositCoin === 'USDT' ? '0.00' : '0.00'}
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
                    }}
                  >
                    {depositReceipt ? depositReceipt.name : 'Select File'}
                  </label>
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
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal - Copy from home.js */}
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
                    });
                    setShowWithdrawModal(false);
                    setWithdrawCoin('');
                    setWithdrawNetwork('');
                    setWithdrawAddress('');
                    setWithdrawAmount('');
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
                  onChange={(e) => {
                    setWithdrawCoin(e.target.value);
                    setWithdrawNetwork('');
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
                  className="deposit-select"
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
                  className="deposit-select"
                  className="deposit-select"
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
                  WALLET ADDRESS *
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
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Amount ($) *
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
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

      {/* Convert Modal */}
      {showConvertModal && selectedHolding && (
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
          onClick={() => setShowConvertModal(false)}
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
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Convert {selectedHolding.symbol} to USDT</h2>
              <button
                onClick={() => setShowConvertModal(false)}
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
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>Available: </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {selectedHolding.qty} {selectedHolding.symbol}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '14px', color: '#9ca3af' }}>Current Price: </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {selectedHolding.price}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                Amount to Convert ({selectedHolding.symbol}) *
              </label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setConvertAmount(e.target.value);
                  const usdValue = amount * selectedHolding.currentPrice;
                  setConvertUsdValue(usdValue);
                }}
                placeholder="0.00"
                min="0"
                max={selectedHolding.quantity}
                step="0.00000001"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  setConvertAmount(selectedHolding.quantity.toString());
                  const usdValue = selectedHolding.quantity * selectedHolding.currentPrice;
                  setConvertUsdValue(usdValue);
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  color: '#60a5fa',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Use Max
              </button>
            </div>

            {convertAmount && parseFloat(convertAmount) > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>You will receive: </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#60a5fa' }}>
                    {convertUsdValue.toFixed(2)} USDT
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {parseFloat(convertAmount).toFixed(8)} {selectedHolding.symbol} × {selectedHolding.price} = {convertUsdValue.toFixed(2)} USDT
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                if (!convertAmount || parseFloat(convertAmount) <= 0) {
                  toast.error('Please enter a valid amount');
                  return;
                }
                if (parseFloat(convertAmount) > selectedHolding.quantity) {
                  toast.error('Amount exceeds available balance');
                  return;
                }

                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    toast.error('Please log in');
                    return;
                  }

                  const response = await fetch('/api/assets/convert', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      portfolio_id: selectedHolding.id,
                      asset_id: selectedHolding.asset_id,
                      asset_type: selectedHolding.asset_type,
                      asset_symbol: selectedHolding.symbol,
                      quantity: parseFloat(convertAmount),
                      usd_value: convertUsdValue,
                    }),
                  });

                  const result = await response.json();
                  if (result.success) {
                    toast.success('Converted successfully!');
                    setShowConvertModal(false);
                    setSelectedHolding(null);
                    setConvertAmount('');
                    setConvertUsdValue(0);
                    // Wait a bit to ensure database write completes, then refresh
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  } else {
                    toast.error(result.error || 'Failed to convert');
                  }
                } catch (error) {
                  console.error('Convert error:', error);
                  toast.error('Failed to convert');
                }
              }}
              disabled={!convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > selectedHolding.quantity}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: (!convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > selectedHolding.quantity)
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: (!convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > selectedHolding.quantity) ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                opacity: (!convertAmount || parseFloat(convertAmount) <= 0 || parseFloat(convertAmount) > selectedHolding.quantity) ? 0.5 : 1,
              }}
            >
              Confirm Convert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetsPage;

