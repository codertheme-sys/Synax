import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Script from 'next/script';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

// TradingView News Widget Component - Using Next.js Script component
function TradingViewNewsWidget() {
  const newsWidgetRef = useRef(null);
  const [widgetKey, setWidgetKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && newsWidgetRef.current) {
      // Clear any existing content
      newsWidgetRef.current.innerHTML = '';

      // Create container structure
      const container = document.createElement('div');
      container.className = 'tradingview-widget-container';
      container.style.cssText = 'height: 100%; width: 100%; position: relative;';
      
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      widgetDiv.id = `tradingview-news-widget-${widgetKey}`;
      widgetDiv.style.cssText = 'height: 100%; width: 100%;';
      
      container.appendChild(widgetDiv);
      newsWidgetRef.current.appendChild(container);

      // Create and append script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      script.async = true;
      
      const widgetConfig = {
        "feedMode": "all_symbols",
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "locale": "en"
      };

      // Set config as script innerHTML (TradingView format)
      script.innerHTML = JSON.stringify(widgetConfig);
      widgetDiv.appendChild(script);
      
      script.onload = () => {
        console.log('TradingView news widget script loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('Failed to load TradingView news widget script:', error);
      };

      return () => {
        if (newsWidgetRef.current) {
          newsWidgetRef.current.innerHTML = '';
        }
      };
    }
  }, [widgetKey]);

  return (
    <>
      <div 
        ref={newsWidgetRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '350px',
          position: 'relative',
          overflow: 'hidden'
        }} 
      />
    </>
  );
}

// Alerts Component Wrapper
function AlertsManagerWrapper({ selectedAsset }) {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    fetchUserId();
  }, []);

  return <AlertsManager userId={userId} selectedAsset={selectedAsset} />;
}

// Order Book Component - Real-time Binance order book
function OrderBook({ symbol }) {
  const [orderBook, setOrderBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    const fetchOrderBook = async () => {
      try {
        const response = await fetch(`/api/binance/orderbook?symbol=${symbol}&limit=20`);
        
        if (!response.ok) {
          console.error(`Order book fetch failed: ${response.status} ${response.statusText}`);
          setOrderBook(null);
          setLoading(false);
          return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setOrderBook(result.data);
        } else {
          console.error('Order book API returned error:', result.error);
          setOrderBook(null);
        }
      } catch (error) {
        console.error('Error fetching order book:', error);
        setOrderBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading) {
  return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        Loading order book...
        </div>
    );
  }

  if (!orderBook) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        No order book data available
      </div>
    );
  }

  const maxCumulative = Math.max(
    ...orderBook.bids.map(b => b.cumulative),
    ...orderBook.asks.map(a => a.cumulative)
  );

  return (
    <div>
      {/* Spread Info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Spread</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
            ${orderBook.spread.toFixed(2)} ({orderBook.spreadPercent.toFixed(3)}%)
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Best Bid</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80' }}>
            ${orderBook.bestBid.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Best Ask</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171' }}>
            ${orderBook.bestAsk.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Order Book Table */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Bids (Buy Orders) */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#4ade80', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            BIDS (BUY)
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '6px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'right', color: '#9ca3af', fontWeight: 600 }}>Quantity</th>
                  <th style={{ padding: '6px', textAlign: 'right', color: '#9ca3af', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                {orderBook.bids.map((bid, idx) => (
                      <tr
                    key={idx} 
                        style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      position: 'relative'
                    }}
                  >
                    <td style={{ 
                      padding: '6px', 
                      color: '#4ade80', 
                      fontWeight: 500,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      ${bid.price.toFixed(2)}
                        </td>
                    <td style={{ 
                      padding: '6px', 
                      color: '#ffffff', 
                      textAlign: 'right',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {bid.quantity.toFixed(8)}
                        </td>
                    <td style={{ 
                      padding: '6px', 
                      color: '#ffffff', 
                      textAlign: 'right',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      ${bid.total.toFixed(2)}
                        </td>
                    {/* Depth visualization */}
                    <td style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${(bid.cumulative / maxCumulative) * 100}%`,
                      background: 'rgba(34, 197, 94, 0.1)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

        {/* Asks (Sell Orders) */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#f87171', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            ASKS (SELL)
                      </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '6px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'right', color: '#9ca3af', fontWeight: 600 }}>Quantity</th>
                  <th style={{ padding: '6px', textAlign: 'right', color: '#9ca3af', fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderBook.asks.map((ask, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      position: 'relative'
                    }}
                  >
                    <td style={{ 
                      padding: '6px', 
                      color: '#f87171', 
                      fontWeight: 500,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      ${ask.price.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '6px', 
                      color: '#ffffff', 
                      textAlign: 'right',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {ask.quantity.toFixed(8)}
                    </td>
                    <td style={{ 
                      padding: '6px', 
                      color: '#ffffff', 
                      textAlign: 'right',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      ${ask.total.toFixed(2)}
                    </td>
                    {/* Depth visualization */}
                    <td style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${(ask.cumulative / maxCumulative) * 100}%`,
                      background: 'rgba(239, 68, 68, 0.1)',
                      zIndex: 0,
                      pointerEvents: 'none'
                    }} />
                  </tr>
                ))}
              </tbody>
            </table>
                  </div>
                </div>
      </div>
    </div>
  );
}

// Alerts Component
function AlertsManager({ userId, selectedAsset }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [conditionOperator, setConditionOperator] = useState('>=');
  const [conditionValue, setConditionValue] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/alerts/list?status=active', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setAlerts(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const handleCreateAlert = async () => {
    // Normalize value: replace comma with dot for proper parsing
    const normalizedValue = conditionValue.replace(',', '.');
    const priceValue = parseFloat(normalizedValue);
    
    if (!conditionValue || isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price value');
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const assetType = selectedAsset === 'XAU' ? 'gold' : 'crypto';

      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          asset_symbol: selectedAsset,
          asset_type: assetType,
          condition_type: 'price',
          condition_value: priceValue,
          condition_operator: conditionOperator,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Alert created successfully!');
        setShowCreateModal(false);
        setConditionValue('');
        // Refresh alerts
        const listResponse = await fetch('/api/alerts/list?status=active', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        const listResult = await listResponse.json();
        if (listResult.success) {
          setAlerts(listResult.data || []);
        }
      } else {
        toast.error(result.error || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/alerts/delete?alertId=${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Alert deleted successfully');
        setAlerts(alerts.filter(a => a.id !== alertId));
      } else {
        toast.error(result.error || 'Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Loading alerts...</div>;
  }

  const filteredAlerts = alerts.filter(a => 
    a.asset_symbol?.toUpperCase() === selectedAsset.toUpperCase()
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Price Alerts</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '12px' }}>
            No alerts for {selectedAsset}
          </div>
        ) : (
                <div>
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '8px',
                  marginBottom: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                    {alert.asset_symbol} {alert.condition_operator} ${parseFloat(alert.condition_value).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    {alert.status === 'triggered' ? 'Triggered' : 'Active'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
                      </div>
                    ))}
                  </div>
        )}
                </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            overflowY: 'auto',
            padding: '24px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#0f1124',
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#ffffff' }}>
              Create Price Alert
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                Asset: {selectedAsset}
              </label>
              </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                Condition
              </label>
              <select
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                }}
              >
                <option value=">=" style={{ background: '#0f1124' }}>Price &gt;= (Above or Equal)</option>
                <option value=">" style={{ background: '#0f1124' }}>Price &gt; (Above)</option>
                <option value="<=" style={{ background: '#0f1124' }}>Price &lt;= (Below or Equal)</option>
                <option value="<" style={{ background: '#0f1124' }}>Price &lt; (Below)</option>
                <option value="==" style={{ background: '#0f1124' }}>Price == (Equal)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                Price Value ($)
              </label>
              <input
                type="number"
                value={conditionValue}
                onChange={(e) => {
                  // Replace comma with dot for proper parsing
                  const value = e.target.value.replace(',', '.');
                  // Only allow numbers and one decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setConditionValue(value);
                  }
                }}
                placeholder="Enter price (e.g., 86950.00)"
                step="any"
                inputMode="decimal"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                }}
              />
          </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                onClick={() => setShowCreateModal(false)}
                  style={{
                  flex: 1,
                    padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                Cancel
                </button>
                <button
                onClick={handleCreateAlert}
                disabled={creating || !conditionValue}
                  style={{
                  flex: 1,
                    padding: '12px',
                  borderRadius: '8px',
                  background: creating || !conditionValue 
                    ? 'rgba(59, 130, 246, 0.5)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                    fontSize: '14px',
                  fontWeight: 600,
                  cursor: creating || !conditionValue ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Open Orders Component
function OpenOrdersList({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'open', 'partially_filled'])
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const handleCancelOrder = async (orderId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/trading/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Order cancelled successfully');
        // Refresh orders
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'open', 'partially_filled'])
          .order('created_at', { ascending: false })
          .limit(20);
        setOrders(data || []);
      } else {
        toast.error(result.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No open orders</div>;
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <th style={{ padding: '6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#9ca3af' }}>Type</th>
            <th style={{ padding: '6px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#9ca3af' }}>Asset</th>
            <th style={{ padding: '6px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#9ca3af' }}>Qty</th>
            <th style={{ padding: '6px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#9ca3af' }}>Price</th>
            <th style={{ padding: '6px', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#9ca3af' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <td style={{ padding: '6px' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontWeight: 600,
                  background: order.side === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: order.side === 'buy' ? '#4ade80' : '#f87171',
                }}>
                  {order.side?.toUpperCase() || 'N/A'}
                </span>
              </td>
              <td style={{ padding: '6px', color: '#ffffff', fontSize: '11px' }}>{order.asset_symbol || 'N/A'}</td>
              <td style={{ padding: '6px', color: '#ffffff', fontSize: '11px', textAlign: 'right' }}>{parseFloat(order.quantity || 0).toFixed(4)}</td>
              <td style={{ padding: '6px', color: '#ffffff', fontSize: '11px', textAlign: 'right' }}>${parseFloat(order.price || 0).toFixed(2)}</td>
              <td style={{ padding: '6px', textAlign: 'center' }}>
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '9px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
              </div>
  );
}

function TradePage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [timeFrame, setTimeFrame] = useState(60); // 60, 80, 90, 100, 120 seconds
  const [side, setSide] = useState('buy'); // 'buy' (LONG) or 'sell' (SHORT)
  const [tradeAmount, setTradeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  const [assets, setAssets] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [maxBuyAmount, setMaxBuyAmount] = useState(0);
  const [maxSellAmount, setMaxSellAmount] = useState(0);
  const [amountType, setAmountType] = useState('coin'); // 'coin' or 'usd'
  const [isMobile, setIsMobile] = useState(false);
  const tradingViewWidgetRef = useRef(null);
  const tradingViewTARef = useRef(null);
  const searchInputRef = useRef(null);
  const widgetIdRef = useRef(0);
  
  // Trade result modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [activeTrade, setActiveTrade] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [tradeResult, setTradeResult] = useState(null); // 'win' or 'lost'
  const countdownIntervalRef = useRef(null);

  // Set client-side flag to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Check if mobile
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };
    
    // Check immediately
    checkMobile();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
    }
    
    // Listen for Profile Settings modal open event from Header
    const handleOpenProfileModal = () => {
      router.push('/home?openProfile=true');
    };
    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile);
        window.removeEventListener('openProfileModal', handleOpenProfileModal);
      }
    };
  }, [router]);

  // Wait for TradingView script to load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if TradingView is already loaded
      if (window.TradingView) {
        setTradingViewLoaded(true);
        return;
      }

      // Wait for script to load
      const checkTradingView = setInterval(() => {
        if (window.TradingView) {
          setTradingViewLoaded(true);
          clearInterval(checkTradingView);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkTradingView);
        if (!window.TradingView) {
          console.error('TradingView script failed to load');
        }
      }, 10000);

      return () => clearInterval(checkTradingView);
    }
  }, []);

  // Initialize TradingView widget
  useEffect(() => {
    if (typeof window !== 'undefined' && window.TradingView && tradingViewWidgetRef.current && tradingViewLoaded) {
      // Remove existing widget if any
      if (tradingViewWidgetRef.current.children.length > 0) {
        tradingViewWidgetRef.current.innerHTML = '';
      }

      // Create unique container ID
      const containerId = `tradingview-${Date.now()}`;
      tradingViewWidgetRef.current.id = containerId;

      try {
        // Use advanced-chart widget type for full features including coin selector
        new window.TradingView.widget({
          "autosize": true,
          "symbol": "BINANCE:BTCUSDT",
          "interval": "60",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#0f1124",
          "enable_publishing": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": false,
          "hide_side_toolbar": false,
          "container_id": containerId,
          "height": 600,
          "width": "100%",
          "symbol_search": true,
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650",
          "studies": [
            "Volume@tv-basicstudies"
          ],
          "withdateranges": true,
          "range": "1D",
          "allow_symbol_change": true,
          "details": true,
          "hotlist": true,
          "calendar": false,
          "watchlist": [
            "BINANCE:BTCUSDT",
            "BINANCE:ETHUSDT",
            "BINANCE:SOLUSDT",
            "BINANCE:BNBUSDT",
            "BINANCE:XRPUSDT"
          ],
          "show_watchlist": false,
          "support_host": "https://www.tradingview.com",
          "no_referral_id": true,
          "referral_id": "",
          "overrides": {
            "mainSeriesProperties.candleStyle.upColor": "#22c55e",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "paneProperties.background": "#0f1124",
            "paneProperties.backgroundType": "solid"
          },
          "disabled_features": [],
          "enabled_features": [
            "use_localstorage_for_settings", 
            "side_toolbar_in_fullscreen_mode"
          ],
          "studies_overrides": {},
          "overrides": {
            "mainSeriesProperties.candleStyle.upColor": "#22c55e",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "paneProperties.background": "#0f1124",
            "paneProperties.backgroundType": "solid",
            "scalesProperties.textColor": "#9ca3af"
          }
        });
        console.log('TradingView chart widget initialized successfully');
      } catch (error) {
        console.error('Error initializing TradingView chart widget:', error);
      }
    }
  }, [tradingViewLoaded]);

  // Initialize TradingView Crypto Screener widget
  useEffect(() => {
    console.log('Crypto Screener useEffect triggered', { 
      hasWindow: typeof window !== 'undefined', 
      hasRef: !!tradingViewTARef.current, 
      isClient, 
      tradingViewLoaded 
    });
    
    if (typeof window !== 'undefined' && tradingViewTARef.current && isClient && tradingViewLoaded) {
      console.log('Initializing Crypto Screener widget...');
      
      // Clear any existing content
      tradingViewTARef.current.innerHTML = '';
      
      // Set container ID and class
      tradingViewTARef.current.id = 'tradingview-screener-container';
      tradingViewTARef.current.className = 'tradingview-widget-container';

      // Create widget div
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'tradingview-widget-container__widget';
      widgetDiv.id = 'tradingview-screener-widget';
      widgetDiv.style.cssText = 'height: 500px; width: 100%; overflow: auto; position: relative; z-index: 1;';
      tradingViewTARef.current.appendChild(widgetDiv);

      console.log('Widget div created and appended');

      // Create and append script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
      script.async = true;
      
      const widgetConfig = {
        "width": "100%",
        "height": 500,
        "defaultColumn": "overview",
        "screener_type": "crypto_mkt",
        "displayCurrency": "USD",
        "colorTheme": "dark",
        "locale": "en",
        "isTransparent": false
      };
      
      script.innerHTML = JSON.stringify(widgetConfig);
      
      console.log('Script element created with config:', widgetConfig);
      
      // Remove loading message when script loads
      script.onload = () => {
        console.log('Crypto Screener script loaded successfully');
        if (tradingViewTARef.current) {
          const loadingDivs = tradingViewTARef.current.querySelectorAll('div');
          loadingDivs.forEach(div => {
            if (div.textContent && (div.textContent.includes('Loading') || div.textContent.includes('Widget loading'))) {
              console.log('Removing loading div:', div.textContent);
              div.remove();
            }
          });
        }
      };
      
      script.onerror = (error) => {
        console.error('Crypto Screener script failed to load:', error);
      };
      
      widgetDiv.appendChild(script);
      console.log('Script appended to widget div');

      console.log('TradingView Crypto Screener container ready');
    } else {
      console.log('Crypto Screener initialization skipped - conditions not met');
    }

    // Cleanup: Remove TradingView widgets when component unmounts or route changes
    return () => {
      if (tradingViewTARef.current) {
        tradingViewTARef.current.innerHTML = '';
      }
      // Clean up any TradingView widgets that might be in the DOM outside trade page
      if (typeof window !== 'undefined') {
        const allWidgets = document.querySelectorAll('.tradingview-widget-container');
        allWidgets.forEach(widget => {
          const tradePage = widget.closest('[data-trade-page]');
          if (!tradePage) {
            widget.innerHTML = '';
            widget.remove();
          }
        });
      }
    };
  }, [isClient, tradingViewLoaded]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch assets and current asset price for trading
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const cryptoRes = await fetch('/api/prices/crypto');
        const cryptoData = await cryptoRes.json();
        
        if (cryptoData.success && cryptoData.data) {
          setAssets(cryptoData.data);
          const asset = cryptoData.data.find(c => 
            c.symbol?.toUpperCase() === selectedAsset || 
            c.id?.toUpperCase() === selectedAsset
          );
          
          if (asset) {
            setCurrentAsset({
              symbol: selectedAsset,
              name: asset.name || selectedAsset,
              price: asset.current_price || 0,
              change: asset.price_change_percentage_24h || 0,
            });
          }
        }

        if (selectedAsset === 'XAU') {
          // Fetch gold price separately
          const goldRes = await fetch('/api/prices/gold');
          const goldData = await goldRes.json();
          if (goldData.success && goldData.data) {
            setCurrentAsset({
              symbol: 'XAU',
              name: 'Gold',
              price: goldData.data.current_price || 2030,
              change: goldData.data.price_change_percentage_24h || 0,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    };

    fetchAssets();
    const interval = setInterval(fetchAssets, 30000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setBalance(parseFloat(profile.balance || 0));
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
    
    // Refresh balance every 5 seconds to catch deposit approvals
    const balanceInterval = setInterval(fetchBalance, 5000);
    
    return () => clearInterval(balanceInterval);
  }, []);

  const [currentAsset, setCurrentAsset] = useState({ symbol: 'BTC', name: 'Bitcoin', price: 51200, change: 0 });

  // Fetch watchlist and portfolio
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch watchlist
          const { data: watchlistData } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (watchlistData) {
            // Fetch prices for watchlist items
            const watchlistWithPrices = await Promise.all(
              watchlistData.map(async (item) => {
                try {
                  if (item.asset_type === 'gold') {
                    const goldRes = await fetch('/api/prices/gold');
                    const goldData = await goldRes.json();
                    return {
                      ...item,
                      current_price: goldData.success ? goldData.data.current_price : 0,
                      price_change_percentage_24h: goldData.success ? goldData.data.price_change_percentage_24h : 0,
                    };
                  } else {
                    const cryptoRes = await fetch('/api/prices/crypto');
                    const cryptoData = await cryptoRes.json();
                    const asset = cryptoData.success && cryptoData.data
                      ? cryptoData.data.find(a => a.symbol?.toUpperCase() === item.asset_symbol?.toUpperCase())
                      : null;
                    return {
                      ...item,
                      current_price: asset?.current_price || 0,
                      price_change_percentage_24h: asset?.price_change_percentage_24h || 0,
                    };
                  }
                } catch (err) {
                  return { ...item, current_price: 0, price_change_percentage_24h: 0 };
                }
              })
            );
            setWatchlist(watchlistWithPrices);
          }

          // Fetch portfolio
          const { data: portfolioData } = await supabase
            .from('portfolio')
            .select('*')
            .eq('user_id', session.user.id);

          if (portfolioData) {
            setPortfolio(portfolioData);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate max buy/sell amounts
  useEffect(() => {
    if (currentAsset.price > 0) {
      // Max buy: balance / (price * 1.01) - accounting for 1% fee
      const maxBuy = balance / (currentAsset.price * 1.01);
      setMaxBuyAmount(maxBuy);

      // Max sell: portfolio quantity for this asset
      const portfolioItem = portfolio.find(
        p => p.asset_symbol?.toUpperCase() === selectedAsset?.toUpperCase() ||
             (selectedAsset === 'XAU' && p.asset_type === 'gold')
      );
      setMaxSellAmount(portfolioItem ? parseFloat(portfolioItem.quantity || 0) : 0);
    }
  }, [balance, currentAsset.price, selectedAsset, portfolio]);

  // Update search query when selected asset changes
  useEffect(() => {
    if (!showSearchDropdown) {
      setSearchQuery('');
    }
  }, [selectedAsset, showSearchDropdown]);

  // Debug watchlist - Commented out to reduce console noise
  // useEffect(() => {
  //   console.log('Watchlist state:', watchlist);
  //   console.log('Watchlist length:', watchlist?.length);
  // }, [watchlist]);

  const handleSubmit = async (e, tradeSide = null) => {
    e.preventDefault();
    // Use passed side parameter or fallback to state
    const currentSide = tradeSide || side;
    console.log('=== BINARY TRADE SUBMIT ===');
    console.log('BUY/LONG or SELL/SHORT clicked', { side: currentSide, tradeSide, tradeAmount, timeFrame, selectedAsset, currentAsset });
    
    // Normalize trade amount: replace comma with dot
    const normalizedAmount = tradeAmount.replace(',', '.');
    const amountValue = parseFloat(normalizedAmount);

    if (!tradeAmount || isNaN(amountValue) || amountValue <= 0) {
      console.log('Validation failed: Invalid trade amount');
      toast.error('Please enter a valid trade amount');
      setLoading(false);
      return;
    }

    // Get minimum amount based on time frame
    const minAmounts = {
      60: 100,
      80: 1000,
      90: 5000,
      100: 10000,
      120: 20000
    };
    const minAmount = minAmounts[timeFrame] || 100;

    if (amountValue < minAmount) {
      toast.error(`Minimum trade amount for ${timeFrame} seconds is $${minAmount.toLocaleString('en-US')}`);
      setLoading(false);
      return;
    }

    // Check balance
    if (balance < amountValue) {
      toast.error(
        `Insufficient Balance\nRequired: $${amountValue.toFixed(2)} | Available: $${balance.toFixed(2)}`,
        {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '14px',
            padding: '20px 26px',
            fontSize: '17px',
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(10px)',
            lineHeight: '1.6',
          },
          icon: '⚠️',
        }
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please login to place orders');
        setLoading(false);
        return;
      }

      const asset = currentAsset;
      if (!asset) {
        toast.error('Please select an asset');
        setLoading(false);
        return;
      }

      const assetType = selectedAsset === 'XAU' ? 'gold' : 'crypto';
      const assetId = selectedAsset.toLowerCase();
      const assetSymbol = selectedAsset;
      const assetName = asset.name || selectedAsset;
      const initialPrice = parseFloat(asset.price || asset.current_price || 0);

      // Calculate potential profit percentage
      const profitPercentages = {
        60: 10,
        80: 20,
        90: 30,
        100: 40,
        120: 50
      };
      const potentialProfitPercentage = profitPercentages[timeFrame] || 10;

      // Calculate expires_at (current time + time_frame seconds)
      const expiresAt = new Date(Date.now() + timeFrame * 1000).toISOString();

      const requestBody = {
        asset_type: assetType,
        asset_id: assetId,
        asset_symbol: assetSymbol,
        asset_name: assetName,
        side: currentSide, // 'buy' (LONG) or 'sell' (SHORT)
        time_frame: timeFrame,
        potential_profit_percentage: potentialProfitPercentage,
        trade_amount: amountValue,
        initial_price: initialPrice,
        expires_at: expiresAt,
      };
      
      console.log('=== SENDING BINARY TRADE REQUEST ===');
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/trading/binary-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== BINARY TRADE RESPONSE ===');
      console.log('Status:', response.status);
      const result = await response.json().catch((err) => {
        console.error('Failed to parse response JSON:', err);
        return { success: false, error: 'Failed to parse response' };
      });
      console.log('Response Data:', result);

      if (result.success) {
        toast.success(`Trade placed successfully! ${currentSide === 'buy' ? 'BUY/LONG' : 'SELL/SHORT'} $${amountValue.toFixed(2)}`, {
          duration: 4000,
          style: {
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 600,
          }
        });
        setTradeAmount('');
        // Refresh balance
        const profileResult = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', session.user.id)
          .single();
        if (profileResult.data) {
          setBalance(parseFloat(profileResult.data.balance || 0));
        }
        
        // Show modal and start countdown
        const tradeData = result.data;
        setActiveTrade(tradeData);
        setShowTradeModal(true);
        setCountdown(timeFrame);
        setTradeResult(null);
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current);
              setCountdown(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Show error as toast instead of throwing
        const errorMessage = result.error || result.details || 'Failed to place trade';
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '14px',
            padding: '20px 26px',
            fontSize: '17px',
            fontWeight: 700,
            color: '#ffffff',
            boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(10px)',
            lineHeight: '1.6',
          },
          icon: '⚠️',
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Binary trade error:', error);
      toast.error(error.message || 'Failed to place trade. Please try again.', {
        duration: 6000,
        style: {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          borderRadius: '14px',
          padding: '20px 26px',
          fontSize: '17px',
          fontWeight: 700,
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(239, 68, 68, 0.4)',
          backdropFilter: 'blur(10px)',
          lineHeight: '1.6',
        },
        icon: '⚠️',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle trade completion
  const handleCompleteTrade = async (tradeId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/trading/binary-auto-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ trade_id: tradeId }),
      });

      const result = await response.json();
      if (result.success) {
        setTradeResult(result.win_lost);
        // Store profit/loss amount for display
        if (result.profit_amount !== undefined) {
          setActiveTrade(prev => prev ? { ...prev, profit_amount: result.profit_amount } : null);
        }
        // Refresh balance
        const profileResult = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', session.user.id)
          .single();
        if (profileResult.data) {
          setBalance(parseFloat(profileResult.data.balance || 0));
        }
        
        // Auto-close modal after 5 seconds
        setTimeout(() => {
          setShowTradeModal(false);
          setActiveTrade(null);
          setTradeResult(null);
          setCountdown(0);
        }, 5000);
      } else {
        console.error('Trade completion error:', result);
        toast.error(result.error || result.details || 'Failed to complete trade');
        // Close modal on error
        setShowTradeModal(false);
        setActiveTrade(null);
        setTradeResult(null);
        setCountdown(0);
      }
    } catch (error) {
      console.error('Error completing trade:', error);
      toast.error('Failed to complete trade');
    }
  };

  // Handle countdown completion - when countdown reaches 0, complete the trade
  useEffect(() => {
    if (countdown === 0 && activeTrade?.id && !tradeResult && showTradeModal) {
      // Countdown finished, complete the trade
      handleCompleteTrade(activeTrade.id);
    }
  }, [countdown, activeTrade, tradeResult, showTradeModal]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://s3.tradingview.com/tv.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('TradingView script loaded');
          setTradingViewLoaded(true);
        }}
        onError={(e) => {
          console.error('TradingView script failed to load:', e);
        }}
      />
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
        <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Trade
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#d1d5db', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto', padding: isMobile ? '0 16px' : '0' }}>
            Execute trades with real-time market data and instant execution.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6" data-trade-page>
          {/* News & Signals - Above Chart */}
          <div className="lg:col-span-12" style={{ marginBottom: '24px' }}>
            <div style={{ ...cardStyle, padding: '16px', height: isMobile ? '300px' : '400px', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>News & Signals</h2>
                <span className="text-xs text-gray-400">Today</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: isMobile ? '250px' : '350px', height: '100%' }}>
                <TradingViewNewsWidget />
              </div>
            </div>
          </div>

          {/* Left Side - Chart and Crypto Screener */}
          <div className="lg:col-span-8">
            {/* TradingView Chart */}
            <div style={{ ...cardStyle, padding: '0', overflow: 'visible', marginBottom: '24px', position: 'relative' }}>
              <style jsx global>{`
                .tradingview-widget-container iframe {
                  width: 100% !important;
                  height: 100% !important;
                }
                .tradingview-widget-container iframe body .js-button {
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .tradingview-widget-container iframe body [data-name="alerts"],
                .tradingview-widget-container iframe body .js-button[data-name="alerts"],
                .tradingview-widget-container iframe body button[data-name="alerts"] {
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  z-index: 1000 !important;
                }
              `}</style>
              <div 
                ref={tradingViewWidgetRef}
                style={{ 
                  height: isMobile ? '400px' : '600px', 
                  width: isMobile ? '100%' : 'calc(100% - 300px)', 
                  minHeight: isMobile ? '400px' : '600px',
                  position: 'relative'
                }}
                className="tradingview-widget-container"
              >
                {!isClient && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                    Loading TradingView chart...
                  </div>
                )}
              </div>
              {/* Price Alerts - Right side on desktop, below chart on mobile */}
              {!isMobile && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    right: '0', 
                    top: 0, 
                    width: '280px',
                    height: '600px',
                    zIndex: 10
                  }}
                >
                  <div style={{ ...cardStyle, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <AlertsManagerWrapper selectedAsset={selectedAsset} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Alerts - Mobile: Below chart */}
            {isMobile && (
              <div className="mt-4">
                <div style={{ ...cardStyle, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <AlertsManagerWrapper selectedAsset={selectedAsset} />
                </div>
              </div>
            )}

            {/* Technical Analysis Table - TradingView Crypto Screener */}
            <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', height: '500px', position: 'relative' }}>
              <div 
                ref={tradingViewTARef}
                id="tradingview-screener-container"
                className="tradingview-widget-container"
                style={{ 
                  height: '500px', 
                  width: '100%', 
                  minHeight: '500px',
                  maxHeight: '500px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'block'
                }}
              >
                {!isClient && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                    Loading crypto screener...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Order Book */}
          <div className="lg:col-span-4">
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: isMobile ? '16px' : '12px', 
              marginBottom: '24px' 
            }}>
              {/* Order Book */}
              <div style={{ ...cardStyle, padding: '20px', flex: 1, minWidth: '200px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#ffffff' }}>Order Book</h2>
                <OrderBook symbol={selectedAsset} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-12" style={{ ...cardStyle, padding: isMobile ? '20px' : '28px', paddingLeft: isMobile ? '16px' : '228px', paddingRight: isMobile ? '16px' : '228px' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, marginBottom: isMobile ? '16px' : '24px', textAlign: 'center', color: '#ffffff' }}>Trade</h2>
            
            {/* Funds Display */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-3" style={{ marginBottom: '24px' }}>
              <div style={{ 
                width: isMobile ? '100%' : '150px',
                padding: '16px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Funds</div>
                <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#ffffff', marginBottom: '4px', wordBreak: 'break-word' }}>
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '10px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>●</span>
                  <span>Ready</span>
                </div>
              </div>

              {/* Pair Search - Next to Available Funds */}
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ display: 'block', fontSize: isMobile ? '20px' : '32px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>Pair</label>
                <div style={{ position: 'relative' }} ref={searchInputRef}>
                  <input
                    type="text"
                    value={showSearchDropdown && searchQuery !== null ? searchQuery : `${selectedAsset}${selectedAsset === 'XAU' ? '/USD' : '/USDT'}`}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                      setSearchQuery('');
                      setShowSearchDropdown(true);
                    }}
                    placeholder="Search asset..."
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 500,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    right: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    fontSize: '18px',
                    cursor: 'pointer',
                    pointerEvents: 'none'
                  }}>🔍</span>
                  
                  {showSearchDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'rgba(15, 17, 36, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    }}>
                      {assets
                        .filter(asset => 
                          !searchQuery || 
                          asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.id?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 250)
                        .map((asset, idx) => (
                          <div
                            key={asset.id || idx}
                            onClick={() => {
                              setSelectedAsset(asset.symbol?.toUpperCase() || asset.id?.toUpperCase());
                              setSearchQuery('');
                              setShowSearchDropdown(false);
                            }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: idx < 249 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                              background: selectedAsset === (asset.symbol?.toUpperCase() || asset.id?.toUpperCase())
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'transparent',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedAsset !== (asset.symbol?.toUpperCase() || asset.id?.toUpperCase())) {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedAsset !== (asset.symbol?.toUpperCase() || asset.id?.toUpperCase())) {
                                e.target.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                              {asset.symbol || asset.id}/USDT
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {asset.name || asset.symbol}
                            </div>
                          </div>
                        ))}
                      {/* Gold option */}
                      <div
                        onClick={() => {
                          setSelectedAsset('XAU');
                          setSearchQuery('');
                          setShowSearchDropdown(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: selectedAsset === 'XAU' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedAsset !== 'XAU') {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedAsset !== 'XAU') {
                            e.target.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>XAU/USD</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Gold</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Time Frame Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Time
                </label>
                <select
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value={60} style={{ background: '#0f1124', color: '#ffffff' }}>60 seconds</option>
                  <option value={80} style={{ background: '#0f1124', color: '#ffffff' }}>80 seconds</option>
                  <option value={90} style={{ background: '#0f1124', color: '#ffffff' }}>90 seconds</option>
                  <option value={100} style={{ background: '#0f1124', color: '#ffffff' }}>100 seconds</option>
                  <option value={120} style={{ background: '#0f1124', color: '#ffffff' }}>120 seconds</option>
                </select>
              </div>

              {/* Potential Profit Percentage - Auto-calculated */}
              <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Potential Profit Percentage
                  </label>
                <div
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {timeFrame === 60 ? '10%' :
                   timeFrame === 80 ? '20%' :
                   timeFrame === 90 ? '30%' :
                   timeFrame === 100 ? '40%' :
                   timeFrame === 120 ? '50%' : '10%'}
                </div>
              </div>

              {/* Trade Amount Input - USD only */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Trade Amount
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    fontSize: '17px',
                    fontWeight: 600,
                  }}>$</span>
                <input
                    type="text"
                    value={tradeAmount}
                    onChange={(e) => {
                      // Replace comma with dot for proper parsing
                      const value = e.target.value.replace(',', '.');
                      // Only allow numbers and one decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setTradeAmount(value);
                      }
                    }}
                  style={{
                    width: '100%',
                      padding: '16px 18px 16px 32px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                      fontSize: '17px',
                      fontWeight: 500,
                    outline: 'none',
                      transition: 'all 0.2s',
                  }}
                  placeholder="0.00"
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                />
              </div>
                {/* Minimum amount warning */}
                <div style={{ fontSize: '18px', color: '#9ca3af', marginTop: '8px' }}>
                  Minimum: {
                    timeFrame === 60 ? '$100' :
                    timeFrame === 80 ? '$1,000' :
                    timeFrame === 90 ? '$5,000' :
                    timeFrame === 100 ? '$10,000' :
                    timeFrame === 120 ? '$20,000' : '$100'
                  }
                  </div>
                  </div>


              {/* Submit Buttons - BUY/LONG and SELL/SHORT */}
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e, 'buy');
                }}
                  disabled={loading || !tradeAmount}
                style={{
                  width: '100%',
                    padding: '18px',
                    borderRadius: '12px',
                    background: loading || !tradeAmount 
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'none',
                  color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: loading || !tradeAmount ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: loading || !tradeAmount 
                      ? 'none' 
                      : '0 6px 20px 0 rgba(34, 197, 94, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: loading || !tradeAmount ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Processing...' : 'BUY/LONG'}
              </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e, 'sell');
                  }}
                  disabled={loading || !tradeAmount}
                  style={{
                    width: '100%',
                    padding: '18px',
                    borderRadius: '12px',
                    background: loading || !tradeAmount 
                      ? 'rgba(239, 68, 68, 0.2)' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: loading || !tradeAmount ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: loading || !tradeAmount 
                      ? 'none' 
                      : '0 6px 20px 0 rgba(239, 68, 68, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: loading || !tradeAmount ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Processing...' : 'SELL/SHORT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
      
      {/* Trade Result Modal */}
      {showTradeModal && activeTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }} onClick={() => {
          if (tradeResult) {
            setShowTradeModal(false);
            setActiveTrade(null);
            setTradeResult(null);
            setCountdown(0);
          }
        }}>
          <div style={{
            ...cardStyle,
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
          }} onClick={(e) => e.stopPropagation()}>
            {!tradeResult ? (
              <>
                <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: '#ffffff' }}>
                  Trade Active
                </h2>
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontSize: '72px', fontWeight: 800, color: '#3b82f6', marginBottom: '16px' }}>
                    {countdown}
                  </div>
                  <div style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '8px' }}>
                    Time Remaining (seconds)
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {activeTrade.side === 'buy' ? 'LONG' : 'SHORT'} {activeTrade.asset_symbol} • ${parseFloat(activeTrade.trade_amount).toFixed(2)}
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#9ca3af',
                }}>
                  Please wait for the trade to complete...
                </div>
              </>
            ) : (
              <>
                <h2 style={{ 
                  fontSize: '32px', 
                  fontWeight: 700, 
                  marginBottom: '24px', 
                  color: tradeResult === 'win' ? '#22c55e' : '#ef4444'
                }}>
                  {tradeResult === 'win' ? 'WIN!' : 'LOST'}
                </h2>
                <div style={{ marginBottom: '32px' }}>
                  {tradeResult === 'lost' && (
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                    }}>
                      ❌
                    </div>
                  )}
                  <div style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '8px' }}>
                    {activeTrade.side === 'buy' ? 'LONG' : 'SHORT'} {activeTrade.asset_symbol}
                  </div>
                  {activeTrade.profit_amount !== undefined ? (
                    <div style={{ 
                      fontSize: '20px', 
                      color: tradeResult === 'win' ? '#22c55e' : '#ef4444', 
                      fontWeight: 700 
                    }}>
                      {tradeResult === 'win' ? '+$' : '-$'}{Math.abs(activeTrade.profit_amount - parseFloat(activeTrade.trade_amount || 0)).toFixed(2)}
                    </div>
                  ) : (
                    <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600 }}>
                      Amount: ${parseFloat(activeTrade.trade_amount).toFixed(2)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TradePage;

