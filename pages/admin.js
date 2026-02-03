import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ContactMessageCard from '../components/admin/ContactMessageCard';
import PaymentsTab from '../components/admin/PaymentsTab';
import ChatMessagesTab from '../components/admin/ChatMessagesTab';

// Global CSS for select dropdown options
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    select option {
      background-color: #0f1124 !important;
      color: #ffffff !important;
    }
    select:focus option:checked {
      background-color: rgba(59, 130, 246, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
}

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

const stats = [
  { label: 'Total Users', value: '12,458', change: '+12.5%' },
  { label: 'Active Trades', value: '3,247', change: '+8.2%' },
  { label: 'Total Volume', value: '$45.2M', change: '+15.3%' },
  { label: 'Revenue', value: '$892K', change: '+22.1%' },
];

const recentUsers = [
  { id: 1, email: 'user1@example.com', joined: '2024-01-15', status: 'Active' },
  { id: 2, email: 'user2@example.com', joined: '2024-01-14', status: 'Active' },
  { id: 3, email: 'user3@example.com', joined: '2024-01-13', status: 'Pending' },
];

const recentTrades = [
  { id: 1, user: 'user1@example.com', type: 'Buy', asset: 'BTC', amount: '0.5', price: '$51,200', time: '2 min ago' },
  { id: 2, user: 'user2@example.com', type: 'Sell', asset: 'ETH', amount: '10', price: '$2,740', time: '5 min ago' },
  { id: 3, user: 'user3@example.com', type: 'Buy', asset: 'SOL', amount: '50', price: '$105', time: '8 min ago' },
];


function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [binaryTrades, setBinaryTrades] = useState([]);
  const [earnSubscriptions, setEarnSubscriptions] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [showWinLostModal, setShowWinLostModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    tradingEnabled: true,
    depositsEnabled: true,
    withdrawalsEnabled: true,
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to access admin panel');
        return;
      }

      const response = await fetch('/api/admin/data', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const result = await response.json();
        if (result.success) {
          // Debug: log received data with full details
          // Removed debug logs
          setAdminData(result.data);
          // Fetch all users
          const usersResponse = await fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (usersResponse.ok) {
            const usersResult = await usersResponse.json();
            if (usersResult.success) {
              setAllUsers(usersResult.data || []);
            }
          } else {
            // Fallback: use profiles from adminData
            setAllUsers(result.data?.allUsers || []);
          }

          // Fetch all trades
          const tradesResponse = await fetch('/api/admin/trades', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (tradesResponse.ok) {
            const tradesResult = await tradesResponse.json();
            if (tradesResult.success) {
              setAllTrades(tradesResult.data || []);
            }
          } else {
            // Fallback: use recentTrades from adminData
            setAllTrades(result.data?.recentTrades || []);
          }

          // Fetch earn subscriptions
          const { data: subscriptions } = await supabase
            .from('earn_subscriptions')
            .select('*')
            .order('created_at', { ascending: false });
          if (subscriptions) {
            setEarnSubscriptions(subscriptions || []);
          }

          // Fetch binary trades
          const { data: binaryTradesData } = await supabase
            .from('binary_trades')
            .select('*')
            .order('created_at', { ascending: false });
          if (binaryTradesData) {
            setBinaryTrades(binaryTradesData || []);
          }

          // Fetch contact messages
          const { data: contactMessagesData } = await supabase
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
          if (contactMessagesData) {
            setContactMessages(contactMessagesData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/reviews-list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReviews(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    setLoadingUserDetails(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/user-details?user_id=${encodeURIComponent(user.id)}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load user details');
      }

      // Combine trading_history and binary_trades
      const spotTrades = (result.data?.trading_history || []).map(t => ({
        ...t,
        trade_source: 'spot',
      }));
      const binaryTradesData = (result.data?.binary_trades || []).map(t => ({
        ...t,
        trade_source: 'binary',
        // Map binary trade fields to match spot trade format for display
        trade_type: t.side, // buy/sell
        asset_symbol: t.asset_symbol,
        quantity: t.trade_amount, // Use trade_amount as quantity
        price: t.initial_price,
        time_frame: t.time_frame, // Keep time_frame for binary trades
        win_lost: t.win_lost, // Keep win_lost for binary trades
      }));
      const allTrades = [...spotTrades, ...binaryTradesData].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      // Debug: Log KYC documents
      console.log('🔍 [Admin User Details] KYC Documents:', {
        count: result.data?.kyc_documents?.length || 0,
        documents: result.data?.kyc_documents || [],
        profile_kyc_url: result.data?.profile?.kyc_document_url,
        debug_info: result.data?._debug
      });

      // If there's a KYC documents error, log it
      if (result.data?._debug?.kyc_documents_error) {
        console.error('❌ [Admin User Details] KYC Documents API Error:', result.data._debug.kyc_documents_error);
      }

      setUserDetails({
        ...result.data?.profile,
        trades: allTrades,
        portfolio: result.data?.portfolio || [],
        deposits: result.data?.deposits || [],
        withdrawals: result.data?.withdrawals || [],
        balance: result.data?.balance ?? user.balance ?? 0,
        earn_subscriptions: result.data?.earn_subscriptions || [],
        binary_trades: result.data?.binary_trades || [],
        kyc_documents: result.data?.kyc_documents || [],
        convert_history: result.data?.convert_history || [],
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !newBalance) {
      toast.error('Please enter a balance amount');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/update-user-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          balance: parseFloat(newBalance),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update balance');
      }

      toast.success('Balance updated successfully');
      setNewBalance('');
      
      // Update user in list
      const updatedBalance = parseFloat(newBalance);
      setAllUsers(allUsers.map(u => u.id === selectedUser.id ? { ...u, balance: updatedBalance } : u));
      
      if (userDetails) {
        setUserDetails({ ...userDetails, balance: updatedBalance });
      }
      
      // Refresh admin data to ensure consistency
      await fetchAdminData();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast.error(error.message || 'Failed to update balance');
    }
  };

  const handleToggleTradeMode = async (userId, currentMode) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newMode = currentMode === 'win' ? 'lost' : 'win';

      const response = await fetch('/api/admin/set-user-trade-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          trade_mode: newMode,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Trade mode set to ${newMode.toUpperCase()}`);
        
        // Update local state
        setAllUsers(allUsers.map(u => u.id === userId ? { ...u, trade_win_lost_mode: newMode } : u));
        
        if (userDetails && userDetails.id === userId) {
          setUserDetails({ ...userDetails, trade_win_lost_mode: newMode });
        }
        
        // Refresh admin data
        await fetchAdminData();
      } else {
        toast.error(result.error || 'Failed to update trade mode');
      }
    } catch (error) {
      console.error('Error updating trade mode:', error);
      toast.error(error.message || 'Failed to update trade mode');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-16">
        <div className="flex items-center justify-between" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
          <div>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
              System Administration
            </h1>
          </div>
          <Link
            href="/home"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to Home
          </Link>
        </div>

        <div className="flex gap-4 mb-8 border-b border-white/10" style={{ 
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '4px',
        }}>
          {['overview', 'users', 'trades', 'payments', 'reviews', 'messages', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab ? '#ffffff' : '#9ca3af',
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>
            ) : adminData ? (
              <>
                <div style={{ display: 'flex', gap: '40px', marginBottom: '32px', flexWrap: 'wrap' }}>
                  <div style={{ ...cardStyle, padding: '24px', width: '250px', flexShrink: 0 }}>
                    <p style={{ fontSize: '26px', color: '#3b82f6', marginBottom: '8px', fontWeight: 600 }}>Total Users</p>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>{adminData.stats?.totalUsers || 0}</span>
                  </div>
                  <div style={{ ...cardStyle, padding: '24px', width: '250px', flexShrink: 0 }}>
                    <p style={{ fontSize: '26px', color: '#3b82f6', marginBottom: '8px', fontWeight: 600 }}>Active Users</p>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>{adminData.stats?.activeUsers || 0}</span>
                </div>
                  <div style={{ ...cardStyle, padding: '24px', width: '250px', flexShrink: 0 }}>
                    <p style={{ fontSize: '26px', color: '#3b82f6', marginBottom: '8px', fontWeight: 600 }}>Pending KYC</p>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>{adminData.stats?.pendingKyc || 0}</span>
                  </div>
                  <div style={{ ...cardStyle, padding: '24px', width: '250px', flexShrink: 0 }}>
                    <p style={{ fontSize: '26px', color: '#3b82f6', marginBottom: '8px', fontWeight: 600 }}>Total Volume</p>
                    <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>${(adminData.stats?.totalVolume || 0).toLocaleString('en-US')}</span>
                  </div>
            </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div style={{ ...cardStyle, padding: '28px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Pending KYC</h2>
                <div className="space-y-3">
                      {adminData.pendingKyc && Array.isArray(adminData.pendingKyc) && adminData.pendingKyc.length > 0 ? adminData.pendingKyc.map((user) => {
                        // Find KYC documents for this user
                        const userKycDocs = (adminData.pendingKycDocuments && Array.isArray(adminData.pendingKycDocuments)) 
                          ? adminData.pendingKycDocuments.filter(doc => doc.user_id === user.id) 
                          : [];
                        
                        // Removed debug logs
                        
                        return (
                    <div
                      key={user.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: userKycDocs.length > 0 ? '12px' : '0' }}>
                              <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                                  {user.email || user.id}
                        </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Status: {user.kyc_status || 'pending'}</div>
                      </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    const response = await fetch('/api/admin/kyc-approve', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`,
                                      },
                                      body: JSON.stringify({
                                        user_id: user.id,
                                        action: 'approve',
                                      }),
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      toast.success('KYC approved successfully');
                                      // Refresh admin data instead of full page reload
                                      const adminResponse = await fetch('/api/admin/data', {
                                        headers: {
                                          'Authorization': `Bearer ${session.access_token}`,
                                        },
                                      });
                                      const adminResult = await adminResponse.json();
                                      if (adminResult && adminResult.success && adminResult.data) {
                                        // Removed debug logs
                                        setAdminData(adminResult.data);
                                        // Always refresh users list from adminData
                                        if (adminResult.data.allUsers && Array.isArray(adminResult.data.allUsers)) {
                                          // Removed debug logs
                                          setAllUsers(adminResult.data.allUsers);
                                        }
                                      } else {
                                        console.error('Failed to refresh admin data:', adminResult);
                                        // Fallback to page reload if data refresh fails
                                        setTimeout(() => window.location.reload(), 500);
                                      }
                                    } else {
                                      toast.error(result.error || 'Failed to approve KYC');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to approve KYC');
                                  }
                                }}
                        style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                  color: '#ffffff',
                                  fontSize: '13px',
                          fontWeight: 600,
                                  cursor: 'pointer',
                                  border: 'none',
                                }}
                              >
                                Approve
                              </button>
                            </div>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>ID Documents:</div>
                              {userKycDocs.length > 0 ? (
                                <div className="space-y-2">
                                  {userKycDocs.map((doc) => (
                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>
                                        {doc.document_type?.replace(/_/g, ' ')}:
                      </span>
                                      {doc.document_url && doc.document_url !== 'pending_upload' ? (
                                        <a
                                          href={doc.document_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            fontSize: '12px',
                                            color: '#3b82f6',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          View Document
                                        </a>
                                      ) : (
                                        <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Upload pending</span>
                                      )}
                    </div>
                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No documents uploaded</div>
                              )}
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No pending KYC</div>
                      )}
                    </div>
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '28px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Recent Trades</h2>
                <div className="space-y-3">
                      {adminData.recentTrades && adminData.recentTrades.length > 0 ? adminData.recentTrades.map((trade) => (
                    <div
                      key={trade.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{trade.profiles?.email || trade.user_id}</span>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                                background: trade.trade_type === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: trade.trade_type === 'buy' ? '#4ade80' : '#f87171',
                          }}
                        >
                              {trade.trade_type?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ffffff' }}>
                        <span>
                              {parseFloat(trade.quantity || 0).toFixed(4)} {trade.asset_symbol || 'N/A'}
                        </span>
                            <span style={{ fontWeight: 600 }}>{parseFloat(trade.price || 0).toFixed(2)} USDT</span>
                      </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            {trade.created_at ? new Date(trade.created_at).toLocaleString() : 'N/A'}
                    </div>
                </div>
                      )) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No recent trades</div>
                      )}
              </div>
            </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No data available</div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <div style={{ ...cardStyle, padding: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>User Management</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>User Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Balance</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>KYC Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Joined</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Win/Lost</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{user.email || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{user.username || user.user_name || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(user.balance || 0).toFixed(2)} USDT</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: user.kyc_status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : user.kyc_status === 'pending' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: user.kyc_status === 'approved' ? '#4ade80' : user.kyc_status === 'pending' ? '#fbbf24' : '#f87171',
                          }}>
                            {user.kyc_status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 600, 
                              color: (user.trade_win_lost_mode || 'lost') === 'win' ? '#22c55e' : '#ef4444',
                              textTransform: 'uppercase'
                            }}>
                              {(user.trade_win_lost_mode || 'lost') === 'win' ? 'Win' : 'Lost'}
                            </span>
                            <label style={{ 
                              position: 'relative', 
                              display: 'inline-block', 
                              width: '44px', 
                              height: '24px',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="checkbox"
                                checked={(user.trade_win_lost_mode || 'lost') === 'win'}
                                onChange={() => handleToggleTradeMode(user.id, user.trade_win_lost_mode || 'lost')}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: (user.trade_win_lost_mode || 'lost') === 'win' ? '#22c55e' : '#ef4444',
                                transition: '.4s',
                                borderRadius: '24px',
                              }}>
                                <span style={{
                                  position: 'absolute',
                                  content: '""',
                                  height: '18px',
                                  width: '18px',
                                  left: '3px',
                                  bottom: '3px',
                                  backgroundColor: '#ffffff',
                                  transition: '.4s',
                                  borderRadius: '50%',
                                  transform: (user.trade_win_lost_mode || 'lost') === 'win' ? 'translateX(20px)' : 'translateX(0)',
                                }} />
                              </span>
                            </label>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleViewUserDetails(user)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#60a5fa',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No users found</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <>
            <div style={{ ...cardStyle, padding: '28px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Binary Trades Management</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading trades...</div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>User Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Side</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Asset</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Time Frame</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Initial Price</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Last Price</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Win/Lost</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Admin Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {binaryTrades.map((trade) => {
                      const user = allUsers.find(u => u.id === trade.user_id);
                      return (
                      <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {user?.username || user?.user_name || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                          {user?.email || trade.user_id?.substring(0, 8) || 'N/A'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: trade.side === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: trade.side === 'buy' ? '#4ade80' : '#f87171',
                          }}>
                            {trade.side === 'buy' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{trade.asset_symbol || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{trade.time_frame}s</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(trade.trade_amount || 0).toFixed(2)} USDT</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(trade.initial_price || 0).toFixed(2)} USDT</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {trade.last_price ? `${parseFloat(trade.last_price).toFixed(2)} USDT` : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {trade.win_lost ? (
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: trade.win_lost === 'win' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: trade.win_lost === 'win' ? '#4ade80' : '#f87171',
                            }}>
                              {trade.win_lost.toUpperCase()}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: trade.admin_status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : trade.admin_status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                            color: trade.admin_status === 'approved' ? '#4ade80' : trade.admin_status === 'rejected' ? '#f87171' : '#fbbf24',
                          }}>
                            {trade.admin_status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                          — {/* No actions needed - trades are auto-approved */}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                {binaryTrades.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No binary trades found</div>
                )}
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, padding: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Earn Management</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading subscriptions...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Product</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>APY</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnSubscriptions.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {allUsers.find(u => u.id === sub.user_id)?.email || sub.user_id}
                        </td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{sub.product_name || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {parseFloat(sub.amount || 0).toFixed(8)} {sub.asset_symbol || ''}
                        </td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {parseFloat(sub.apy || 0).toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: sub.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                            color: sub.status === 'active' ? '#4ade80' : '#fbbf24',
                          }}>
                            {sub.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {earnSubscriptions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No subscriptions found</div>
                )}
              </div>
            )}
          </div>
          </>
        )}

        {activeTab === 'payments' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>
            ) : adminData ? (
              <PaymentsTab adminData={adminData} onRefresh={fetchAdminData} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No data available</div>
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <>
            <div style={{ ...cardStyle, padding: '28px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Reviews Management</h2>
              {loadingReviews ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading reviews...</div>
              ) : (
                <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 17, 36, 0.95)', zIndex: 10 }}>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>User</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Rating</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Comment</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((review) => (
                        <tr key={review.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px', color: '#ffffff' }}>
                            {review.user?.username || review.user?.email || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  style={{
                                    fontSize: '16px',
                                    color: star <= review.rating ? '#fbbf24' : '#6b7280',
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#ffffff', maxWidth: '400px', wordWrap: 'break-word' }}>
                            {review.comment}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: review.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : review.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                              color: review.status === 'approved' ? '#4ade80' : review.status === 'rejected' ? '#f87171' : '#fbbf24',
                            }}>
                              {review.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {review.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={async () => {
                                    try {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session?.access_token) return;

                                      const response = await fetch('/api/admin/reviews-update-status', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${session.access_token}`,
                                        },
                                        body: JSON.stringify({
                                          review_id: review.id,
                                          action: 'approve',
                                        }),
                                      });

                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success('Review approved');
                                        fetchReviews();
                                      } else {
                                        toast.error(result.error || 'Failed to approve review');
                                      }
                                    } catch (error) {
                                      console.error('Error approving review:', error);
                                      toast.error('Failed to approve review');
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(34, 197, 94, 0.2)',
                                    border: '1px solid rgba(34, 197, 94, 0.4)',
                                    color: '#4ade80',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session?.access_token) return;

                                      const response = await fetch('/api/admin/reviews-update-status', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${session.access_token}`,
                                        },
                                        body: JSON.stringify({
                                          review_id: review.id,
                                          action: 'reject',
                                        }),
                                      });

                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success('Review rejected');
                                        fetchReviews();
                                      } else {
                                        toast.error(result.error || 'Failed to reject review');
                                      }
                                    } catch (error) {
                                      console.error('Error rejecting review:', error);
                                      toast.error('Failed to reject review');
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#f87171',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                                {review.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reviews.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No reviews found</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'messages' && (
          <>
            <div style={{ ...cardStyle, padding: '28px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Live Chat Messages</h2>
              <ChatMessagesTab />
            </div>
            <div style={{ ...cardStyle, padding: '28px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Contact Messages</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading messages...</div>
              ) : (
                <div className="space-y-4">
                  {contactMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No messages yet</div>
                  ) : (
                    contactMessages.map((message) => (
                      <ContactMessageCard 
                        key={message.id} 
                        message={message} 
                        onUpdate={async () => {
                          await fetchAdminData();
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div style={{ ...cardStyle, padding: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>System Settings</h2>
            <div className="space-y-4">
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Maintenance Mode</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Disable all trading and deposits during maintenance</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: settings.maintenanceMode ? '#ef4444' : 'rgba(34, 197, 94, 0.2)',
                    color: settings.maintenanceMode ? '#ffffff' : '#4ade80',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {settings.maintenanceMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Trading Enabled</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Allow users to place buy/sell orders</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, tradingEnabled: !settings.tradingEnabled })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: settings.tradingEnabled ? 'rgba(34, 197, 94, 0.2)' : '#ef4444',
                    color: settings.tradingEnabled ? '#4ade80' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {settings.tradingEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Deposits Enabled</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Allow users to deposit funds</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, depositsEnabled: !settings.depositsEnabled })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: settings.depositsEnabled ? 'rgba(34, 197, 94, 0.2)' : '#ef4444',
                    color: settings.depositsEnabled ? '#4ade80' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {settings.depositsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>Withdrawals Enabled</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Allow users to withdraw funds</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, withdrawalsEnabled: !settings.withdrawalsEnabled })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: settings.withdrawalsEnabled ? 'rgba(34, 197, 94, 0.2)' : '#ef4444',
                    color: settings.withdrawalsEnabled ? '#4ade80' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {settings.withdrawalsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Balance Migration Section */}
              <div style={{
                padding: '24px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '10px',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                marginTop: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    🔄 Balance Migration: USD → USDT
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                    Convert all existing USD balances to USDT. This will fetch the current USDT price from CoinGecko and convert all user balances accordingly.
                    <br />
                    <strong style={{ color: '#fbbf24' }}>⚠️ Warning: This action cannot be undone. Make sure to backup your data before proceeding.</strong>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to migrate all USD balances to USDT? This action cannot be undone.')) {
                      return;
                    }

                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session?.access_token) {
                        toast.error('Please login again');
                        return;
                      }

                      toast.loading('Migrating balances...', { id: 'migration' });

                      const response = await fetch('/api/admin/migrate-balance-to-usdt', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                      });

                      const result = await response.json();

                      if (result.success) {
                        toast.success(
                          `Migration completed! ${result.migrated} profiles migrated, ${result.failed} failed. USDT price: $${result.usdt_price.toFixed(4)}`,
                          { id: 'migration', duration: 10000 }
                        );
                      } else {
                        toast.error(result.error || 'Migration failed', { id: 'migration' });
                      }
                    } catch (error) {
                      console.error('Balance migration error:', error);
                      toast.error('Failed to migrate balances. Please try again.', { id: 'migration' });
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  Migrate All Balances to USDT
                </button>
              </div>

              {/* USDT Portfolio to Balance Migration Section */}
              <div style={{
                padding: '24px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '10px',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                marginTop: '24px',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    💰 USDT Portfolio → Balance Migration
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                    Move all USDT from portfolio to cash balance. USDT should only be in balance, not in portfolio.
                    <br />
                    <strong style={{ color: '#fbbf24' }}>⚠️ Warning: This will delete USDT items from portfolio and add them to user balances.</strong>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to migrate USDT from portfolio to balance? This will move all USDT items to user balances and remove them from portfolio.')) {
                      return;
                    }

                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        toast.error('Please login');
                        return;
                      }

                      toast.loading('Migrating USDT from portfolio to balance...', { id: 'usdt-migration' });

                      const response = await fetch('/api/admin/migrate-usdt-to-balance', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                      });

                      const result = await response.json();

                      if (result.success) {
                        toast.success(
                          `USDT migration completed! ${result.migrated} users migrated, ${result.failed} failed. Total USDT migrated: ${result.total_usdt_migrated?.toFixed(2) || 0} USDT`,
                          { id: 'usdt-migration', duration: 10000 }
                        );
                        // Refresh admin data
                        fetchAdminData();
                      } else {
                        toast.error(result.error || 'Migration failed', { id: 'usdt-migration' });
                      }
                    } catch (error) {
                      console.error('USDT migration error:', error);
                      toast.error('Failed to migrate USDT. Please try again.', { id: 'usdt-migration' });
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Migrate USDT from Portfolio to Balance
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Details Page - Full Screen */}
      {showUserDetails && selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            overflow: 'auto',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#ffffff',
                }}>
                  👤
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>User Details</h2>
              </div>
              <button
                onClick={() => setShowUserDetails(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {loadingUserDetails ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Loading...</div>
            ) : userDetails ? (
              <div className="space-y-6">
                {/* General Information Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#ffffff',
                    }}>
                      📄
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>General Information</h3>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px',
                    padding: '20px',
                    background: 'rgba(15, 17, 36, 0.5)',
                    borderRadius: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>User Name</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{userDetails.username || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>User e-mail</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{userDetails.email || selectedUser.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Full Name</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{userDetails.full_name || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>KYC Status</div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'inline-block',
                        background: userDetails.kyc_status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : userDetails.kyc_status === 'pending' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: userDetails.kyc_status === 'approved' ? '#4ade80' : userDetails.kyc_status === 'pending' ? '#fbbf24' : '#f87171',
                      }}>
                        {userDetails.kyc_status || 'pending'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Balance (Total)</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>
                        {parseFloat(userDetails.balance || 0).toFixed(2)} USDT
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Status</div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#4ade80',
                      }}>
                        <span>✓</span> Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* KYC Document Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#ffffff',
                    }}>
                      🆔
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>ID KYC Document</h3>
                  </div>
                  
                  {(() => {
                    // Debug: Log current state
                    console.log('🔍 [KYC Display] userDetails.kyc_documents:', userDetails.kyc_documents);
                    console.log('🔍 [KYC Display] userDetails.kyc_document_url:', userDetails.kyc_document_url);
                    
                    // Find the most recent KYC document (any type, prioritize id_card)
                    let kycDoc = null;
                    if (userDetails.kyc_documents && userDetails.kyc_documents.length > 0) {
                      console.log('🔍 [KYC Display] Found', userDetails.kyc_documents.length, 'KYC documents');
                      
                      // First try to find id_card
                      const idCards = userDetails.kyc_documents
                        .filter(d => d.document_type === 'id_card' && d.document_url && d.document_url !== 'pending_upload');
                      console.log('🔍 [KYC Display] ID cards found:', idCards.length);
                      
                      kycDoc = idCards.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                      
                      // If no id_card, get any document with URL
                      if (!kycDoc) {
                        const allDocs = userDetails.kyc_documents
                          .filter(d => d.document_url && d.document_url !== 'pending_upload');
                        console.log('🔍 [KYC Display] All valid documents:', allDocs.length);
                        kycDoc = allDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                      }
                      
                      console.log('🔍 [KYC Display] Selected document:', kycDoc);
                    } else {
                      console.log('🔍 [KYC Display] No KYC documents array or empty');
                    }
                    
                    // Fallback to profile kyc_document_url
                    const documentUrl = kycDoc?.document_url || userDetails.kyc_document_url;
                    console.log('🔍 [KYC Display] Final document URL:', documentUrl);
                    
                    // If URL is from Supabase storage, ensure it's accessible
                    let finalDocumentUrl = documentUrl;
                    if (documentUrl && documentUrl.includes('supabase.co/storage')) {
                      // Supabase storage URL is already public, use as is
                      finalDocumentUrl = documentUrl;
                    }
                    
                    if (finalDocumentUrl && finalDocumentUrl !== 'pending_upload') {
                      const isImage = finalDocumentUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) || 
                                      finalDocumentUrl.startsWith('data:image') ||
                                      finalDocumentUrl.includes('image');
                      
                      console.log('🔍 [KYC Display] Is image:', isImage, 'URL:', finalDocumentUrl);
                      
                      return (
                        <div style={{ padding: '20px', background: 'rgba(15, 17, 36, 0.5)', borderRadius: '12px' }}>
                          {isImage ? (
                            <>
                              <img 
                                src={finalDocumentUrl} 
                                alt="KYC Document" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '600px', 
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  objectFit: 'contain',
                                  display: 'block',
                                  margin: '0 auto',
                                }}
                                onError={(e) => {
                                  console.error('❌ [KYC Display] Image load error:', finalDocumentUrl);
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'inline-block';
                                  }
                                }}
                                onLoad={() => {
                                  console.log('✅ [KYC Display] Image loaded successfully:', finalDocumentUrl);
                                }}
                              />
                              <a 
                                href={finalDocumentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  padding: '12px 24px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                  color: '#ffffff',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  marginTop: '12px',
                                }}
                              >
                                Open in New Tab
                              </a>
                            </>
                          ) : (
                            <a 
                              href={finalDocumentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontWeight: 600,
                              }}
                            >
                              View KYC Document
                            </a>
                          )}
                          {kycDoc && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
                              Type: {kycDoc.document_type?.replace(/_/g, ' ') || 'N/A'} | 
                              Status: {kycDoc.status || 'pending'} | 
                              Uploaded: {kycDoc.created_at ? new Date(kycDoc.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      console.log('❌ [KYC Display] No valid document URL found');
                      return (
                        <div style={{ padding: '40px', background: 'rgba(15, 17, 36, 0.5)', borderRadius: '12px', textAlign: 'center', color: '#9ca3af' }}>
                          <div style={{ marginBottom: '12px' }}>No KYC document uploaded</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            Debug: kyc_documents={userDetails.kyc_documents?.length || 0}, 
                            kyc_document_url={userDetails.kyc_document_url ? 'exists' : 'null'}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Balance Section */}
                <div style={{ ...cardStyle, padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Balance (USDT)</h3>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>
                      {parseFloat(userDetails.balance || 0).toFixed(2)} USDT
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      placeholder="New balance amount"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      onClick={handleUpdateBalance}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Assets Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Assets</h3>
                  {userDetails.portfolio && userDetails.portfolio.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Symbol</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Quantity</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.portfolio.map((asset) => (
                            <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{asset.asset_symbol || 'N/A'}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(asset.quantity || 0).toFixed(8)}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(asset.total_value || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No assets found</div>
                  )}
                </div>

                {/* Deposits Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Deposits ({userDetails.deposits?.length || 0})</h3>
                  {userDetails.deposits && userDetails.deposits.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Coin</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Network</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.deposits.map((deposit) => {
                            const coinNetwork = deposit.transaction_id?.split(':') || [];
                            const coin = coinNetwork[0] || deposit.payment_provider || 'N/A';
                            const network = coinNetwork[1] || 'N/A';
                            // Format amount based on coin type - show full precision for crypto, 2 decimals for USD
                            const amountValue = parseFloat(deposit.amount || 0);
                            const isCrypto = coin && coin !== 'USD' && coin !== 'USDT' && coin !== 'N/A';
                            const formattedAmount = isCrypto 
                              ? amountValue.toFixed(8).replace(/\.?0+$/, '') // Remove trailing zeros for crypto
                              : amountValue.toFixed(2);
                            return (
                              <tr key={deposit.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '12px', color: '#4ade80', fontWeight: 600 }}>
                                  {isCrypto ? formattedAmount : `$${formattedAmount}`}
                                </td>
                                <td style={{ padding: '12px', color: '#ffffff' }}>{coin}</td>
                                <td style={{ padding: '12px', color: '#ffffff' }}>{network}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: deposit.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : deposit.status === 'pending' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: deposit.status === 'completed' ? '#4ade80' : deposit.status === 'pending' ? '#fbbf24' : '#f87171',
                                  }}>
                                    {deposit.status || 'pending'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                                  {deposit.created_at ? new Date(deposit.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No deposits found</div>
                  )}
                </div>

                {/* Withdrawals Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Withdrawals ({userDetails.withdrawals?.length || 0})</h3>
                  {userDetails.withdrawals && userDetails.withdrawals.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Coin</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Network</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.withdrawals.map((withdrawal) => {
                            const coinNetwork = withdrawal.wallet_address?.split(':') || [];
                            const coin = coinNetwork[0] || 'N/A';
                            const network = coinNetwork[1] || 'N/A';
                            return (
                              <tr key={withdrawal.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '12px', color: '#ef4444', fontWeight: 600 }}>${parseFloat(withdrawal.amount || 0).toFixed(2)}</td>
                                <td style={{ padding: '12px', color: '#ffffff' }}>{coin}</td>
                                <td style={{ padding: '12px', color: '#ffffff' }}>{network}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: withdrawal.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : withdrawal.status === 'pending' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: withdrawal.status === 'completed' ? '#4ade80' : withdrawal.status === 'pending' ? '#fbbf24' : '#f87171',
                                  }}>
                                    {withdrawal.status || 'pending'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                                  {withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No withdrawals found</div>
                  )}
                </div>

                {/* Convert History Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Convert History ({userDetails.convert_history?.length || 0})</h3>
                  {userDetails.convert_history && userDetails.convert_history.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Asset</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Quantity</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Price</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>USDT Value</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.convert_history.map((convert) => (
                            <tr key={convert.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{convert.asset_symbol || 'N/A'}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(convert.quantity || 0).toFixed(8).replace(/\.?0+$/, '')}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(convert.price || 0).toFixed(2)}</td>
                              <td style={{ padding: '12px', color: '#4ade80', fontWeight: 600 }}>${parseFloat(convert.usd_value || 0).toFixed(2)}</td>
                              <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                                {convert.created_at ? new Date(convert.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No convert history found</div>
                  )}
                </div>

                {/* Trades Section */}
                <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Trades ({userDetails.trades?.length || 0})</h3>
                  {userDetails.trades && userDetails.trades.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Asset</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Trade Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Time Frame</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.trades.map((trade) => (
                            <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: trade.trade_type === 'buy' || trade.side === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: trade.trade_type === 'buy' || trade.side === 'buy' ? '#4ade80' : '#f87171',
                                }}>
                                  {trade.trade_type?.toUpperCase() || trade.side?.toUpperCase() || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{trade.asset_symbol || 'N/A'}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>
                                {trade.trade_amount ? `$${parseFloat(trade.trade_amount).toFixed(2)}` : trade.quantity ? `${parseFloat(trade.quantity).toFixed(8)}` : 'N/A'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                {trade.win_lost ? (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    background: trade.win_lost === 'win' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: trade.win_lost === 'win' ? '#4ade80' : '#f87171',
                                  }}>
                                    {trade.win_lost.toUpperCase()}
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>
                                {trade.time_frame ? `${trade.time_frame}s` : '—'}
                              </td>
                              <td style={{ padding: '12px', color: '#9ca3af', fontSize: '12px' }}>
                                {trade.created_at ? new Date(trade.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No trades found</div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No data available</div>
            )}
          </div>
        </div>
      )}

      {/* Win/Lost Modal */}
      {showWinLostModal && selectedTrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(15, 17, 36, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Set Win/Lost</h3>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
              Select whether this trade resulted in a WIN or LOST. The final price will be calculated automatically by the system.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch('/api/admin/binary-trade-approve', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        trade_id: selectedTrade.id,
                        win_lost: 'win',
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      toast.success('Trade approved as WIN');
                      setShowWinLostModal(false);
                      setSelectedTrade(null);
                      fetchAdminData();
                    } else {
                      toast.error(result.error || 'Failed to approve trade');
                    }
                  } catch (error) {
                    toast.error('Failed to approve trade');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                WIN
              </button>
              <button
                onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch('/api/admin/binary-trade-approve', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        trade_id: selectedTrade.id,
                        win_lost: 'lost',
                      }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      toast.success('Trade approved as LOST');
                      setShowWinLostModal(false);
                      setSelectedTrade(null);
                      fetchAdminData();
                    } else {
                      toast.error(result.error || 'Failed to approve trade');
                    }
                  } catch (error) {
                    toast.error('Failed to approve trade');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                LOST
              </button>
            </div>
            <button
              onClick={() => {
                setShowWinLostModal(false);
                setSelectedTrade(null);
              }}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;




