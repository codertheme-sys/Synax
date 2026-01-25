import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ReceiptViewer from './ReceiptViewer';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function PaymentsTab({ adminData, onRefresh }) {
  const [paymentTab, setPaymentTab] = useState('pending');
  const [processingIds, setProcessingIds] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const deposits = adminData.deposits || {
    pending: adminData.pendingDeposits || [],
    approved: [],
    rejected: []
  };
  const withdrawals = adminData.withdrawals || {
    pending: adminData.pendingWithdrawals || [],
    approved: [],
    rejected: []
  };

  const handleApprove = async (id, type) => {
    if (processingIds.has(id)) return;
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = type === 'deposit' ? '/api/admin/deposit-approve' : '/api/admin/withdraw-approve';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          deposit_id: type === 'deposit' ? id : undefined,
          withdrawal_id: type === 'withdrawal' ? id : undefined,
          action: 'approve',
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} approved successfully`);
        if (onRefresh) {
          await onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(result.error || `Failed to approve ${type}`);
      }
    } catch (error) {
      toast.error(`Failed to approve ${type}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleReject = async (id, type) => {
    if (processingIds.has(id)) return;
    
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = type === 'deposit' ? '/api/admin/deposit-approve' : '/api/admin/withdraw-approve';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          deposit_id: type === 'deposit' ? id : undefined,
          withdrawal_id: type === 'withdrawal' ? id : undefined,
          action: 'reject',
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} rejected`);
        if (onRefresh) {
          await onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(result.error || `Failed to reject ${type}`);
      }
    } catch (error) {
      toast.error(`Failed to reject ${type}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const renderPaymentItem = (item, type) => {
    const isProcessing = processingIds.has(item.id);
    const isDeposit = type === 'deposit';
    
    let coin = 'N/A';
    let network = 'N/A';
    if (isDeposit) {
      const coinNetwork = item.transaction_id?.split(':') || [];
      coin = coinNetwork[0] || item.payment_provider || 'N/A';
      network = coinNetwork[1] || 'N/A';
    }
    
    const receiptUrl = item.bank_receipt_url || item.receipt_url || item.bank_receipt || null;
    const statusColor = paymentTab === 'pending' ? '#f59e0b' : paymentTab === 'approved' ? '#10b981' : '#ef4444';
    
    return (
      <div
        key={item.id}
        style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              {item.profiles?.user_name || item.profiles?.username || item.profiles?.full_name || item.profiles?.email || item.user_id}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              Type: <span style={{ color: '#ffffff', fontWeight: 600 }}>{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
            </div>
            {isDeposit ? (
              <>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Amount: <span style={{ color: '#ffffff', fontWeight: 600 }}>
                    {parseFloat(item.amount || 0).toFixed(coin === 'BTC' || coin === 'ETH' ? 8 : 2)} {coin}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Coin: <span style={{ color: '#ffffff' }}>{coin}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Network: <span style={{ color: '#ffffff' }}>{network}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Amount: <span style={{ color: '#ffffff', fontWeight: 600 }}>{parseFloat(item.amount || 0).toFixed(2)} USDT</span>
                </div>
                {item.crypto_address && (
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                    Wallet Address: <span style={{ color: '#ffffff', wordBreak: 'break-all' }}>{item.crypto_address}</span>
                  </div>
                )}
                {item.crypto_network && (
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                    Network: <span style={{ color: '#ffffff' }}>{item.crypto_network}</span>
                  </div>
                )}
                {item.bank_account && (
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                    Bank Account: <span style={{ color: '#ffffff', wordBreak: 'break-all' }}>{item.bank_account}</span>
                  </div>
                )}
              </>
            )}
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              Status: <span style={{ color: statusColor, fontWeight: 600 }}>{item.status}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              Date: <span style={{ color: '#ffffff' }}>{item.created_at ? new Date(item.created_at).toLocaleString('en-US') : 'N/A'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{
              fontSize: isMobile ? '32px' : '48px',
              fontWeight: 700,
              color: isDeposit ? '#22c55e' : '#ef4444',
              textAlign: 'right',
              lineHeight: '1',
            }}>
              {isDeposit ? (
                <>
                  {parseFloat(item.amount || 0).toFixed(coin === 'BTC' || coin === 'ETH' ? 8 : 2)}
                  <span style={{ fontSize: isMobile ? '16px' : '24px', marginLeft: '4px' }}>{coin}</span>
                </>
              ) : (
                <>
                  {parseFloat(item.amount || 0).toFixed(2)}
                  <span style={{ fontSize: isMobile ? '16px' : '24px', marginLeft: '4px' }}>USDT</span>
                </>
              )}
            </div>
            {paymentTab === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
                <button
                  onClick={() => handleApprove(item.id, type)}
                  disabled={isProcessing || item.status !== 'pending'}
                  style={{
                    padding: isMobile ? '8px 16px' : '10px 20px',
                    borderRadius: '8px',
                    background: isProcessing || item.status !== 'pending' 
                      ? 'rgba(16, 185, 129, 0.3)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 600,
                    cursor: isProcessing || item.status !== 'pending' ? 'not-allowed' : 'pointer',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    opacity: isProcessing || item.status !== 'pending' ? 0.6 : 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(item.id, type)}
                  disabled={isProcessing || item.status !== 'pending'}
                  style={{
                    padding: isMobile ? '8px 16px' : '10px 20px',
                    borderRadius: '8px',
                    background: isProcessing || item.status !== 'pending'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: 600,
                    cursor: isProcessing || item.status !== 'pending' ? 'not-allowed' : 'pointer',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    opacity: isProcessing || item.status !== 'pending' ? 0.6 : 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
        {isDeposit && receiptUrl && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>Receipt:</div>
            <ReceiptViewer receiptUrl={receiptUrl} />
          </div>
        )}
      </div>
    );
  };

  const currentDeposits = deposits[paymentTab] || [];
  const currentWithdrawals = withdrawals[paymentTab] || [];
  
  const allItems = [...currentDeposits.map(d => ({ ...d, _type: 'deposit' })), ...currentWithdrawals.map(w => ({ ...w, _type: 'withdrawal' }))];
  allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={{ ...cardStyle, padding: '28px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Payments</h2>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setPaymentTab(tab)}
            style={{
              padding: '12px 24px',
              background: paymentTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: paymentTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              color: paymentTab === tab ? '#60a5fa' : '#9ca3af',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {allItems.length > 0 ? (
        <div className="space-y-4">
          {allItems.map((item) => renderPaymentItem(item, item._type))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          No {paymentTab} payments
        </div>
      )}
    </div>
  );
}

export default PaymentsTab;




