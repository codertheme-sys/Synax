import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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

// Contact Message Card Component
function ContactMessageCard({ message, onUpdate }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState(message.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/contact-message-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messageId: message.id,
          status: newStatus,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus(newStatus);
        toast.success('Status updated successfully');
        if (onUpdate) await onUpdate();
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/contact-message-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messageId: message.id,
          status: 'replied',
          adminNotes: replyText.trim(),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save reply');
      }

      // Then, send email to user
      try {
        const emailResponse = await fetch('/api/admin/send-contact-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messageId: message.id,
            replyMessage: replyText.trim(),
            userEmail: message.email,
            userName: message.full_name,
            subject: message.subject,
          }),
        });

        const emailResult = await emailResponse.json();
        
        setStatus('replied');
        setReplyText('');
        setShowReply(false);
        
        if (emailResult.success && !emailResult.warning) {
          toast.success('Reply saved and email sent successfully');
        } else {
          console.error('Email sending failed:', emailResult);
          console.error('Error details:', emailResult.errorDetails);
          console.error('Warning:', emailResult.warning);
          toast.error(`Reply saved but email failed: ${emailResult.warning || 'Unknown error'}`);
        }
      } catch (emailError) {
        // Email gönderimi başarısız olsa bile reply kaydedildi
        console.error('Email sending exception:', emailError);
        setStatus('replied');
        setReplyText('');
        setShowReply(false);
        toast.error(`Reply saved but email failed: ${emailError.message || 'Network error'}`);
      }
      
      if (onUpdate) await onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to save reply');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
      case 'read':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' };
      case 'replied':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' };
      case 'closed':
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
    }
  };

  const statusColors = getStatusColor(status);

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>{message.subject}</h3>
            <span style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              background: statusColors.bg,
              color: statusColors.color,
            }}>
              {status.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
            <strong style={{ color: '#ffffff' }}>From:</strong> {message.full_name} ({message.email})
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {new Date(message.created_at).toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: updating ? 'not-allowed' : 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px',
            }}
          >
            <option value="new" style={{ background: '#0f1124', color: '#ffffff' }}>New</option>
            <option value="read" style={{ background: '#0f1124', color: '#ffffff' }}>Read</option>
            <option value="replied" style={{ background: '#0f1124', color: '#ffffff' }}>Replied</option>
            <option value="closed" style={{ background: '#0f1124', color: '#ffffff' }}>Closed</option>
          </select>
        </div>
      </div>

      <div style={{
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <p style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {message.message}
        </p>
      </div>

      {message.attachment_url && (
        <div style={{
          padding: '16px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>Attachment:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {message.attachment_type === 'png' || message.attachment_type === 'jpeg' || message.attachment_type === 'jpg' ? (
              <img 
                src={message.attachment_url} 
                alt={message.attachment_name || 'Attachment'} 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                {message.attachment_name || 'Attachment'}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Type: {message.attachment_type?.toUpperCase() || 'Unknown'}
              </div>
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                View/Download
              </a>
            </div>
          </div>
        </div>
      )}

      {message.admin_notes && (
        <div style={{
          padding: '16px',
          background: 'rgba(34, 197, 94, 0.1)',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80', marginBottom: '8px' }}>Admin Reply:</div>
          <p style={{ fontSize: '14px', color: '#d1fae5', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {message.admin_notes}
          </p>
          {message.replied_at && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>
              Replied: {new Date(message.replied_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {!showReply && !message.admin_notes && (
        <button
          onClick={() => setShowReply(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Reply
        </button>
      )}

      {showReply && (
        <div style={{ marginTop: '16px' }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Enter your reply..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReply}
              disabled={updating}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: updating ? 'rgba(59, 130, 246, 0.5)' : 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: updating ? 'not-allowed' : 'pointer',
              }}
            >
              {updating ? 'Saving...' : 'Send Reply'}
            </button>
            <button
              onClick={() => {
                setShowReply(false);
                setReplyText('');
              }}
              disabled={updating}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'rgba(107, 114, 128, 0.2)',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: updating ? 'not-allowed' : 'pointer',
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

// Payments Tab Component - 3 sections: Pending, Approved, Rejected
function PaymentsTab({ adminData, onRefresh }) {
  const [paymentTab, setPaymentTab] = useState('pending');
  const [processingIds, setProcessingIds] = useState(new Set());

  // Removed debug logs

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
        // Refresh admin data instead of full page reload
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
        // Refresh admin data instead of full page reload
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              {item.profiles?.email || item.user_id}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              Type: <span style={{ color: '#ffffff', fontWeight: 600 }}>{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              Amount: <span style={{ color: '#ffffff', fontWeight: 600 }}>${parseFloat(item.amount || 0).toFixed(2)}</span>
            </div>
            {isDeposit && (
              <>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Coin: <span style={{ color: '#ffffff' }}>{coin}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
                  Network: <span style={{ color: '#ffffff' }}>{network}</span>
                </div>
              </>
            )}
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              Status: <span style={{ color: statusColor, fontWeight: 600 }}>{item.status}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              Date: <span style={{ color: '#ffffff' }}>{item.created_at ? new Date(item.created_at).toLocaleString('en-US') : 'N/A'}</span>
            </div>
          </div>
          {paymentTab === 'pending' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleApprove(item.id, type)}
                disabled={isProcessing || item.status !== 'pending'}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: isProcessing || item.status !== 'pending' 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
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
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: isProcessing || item.status !== 'pending'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
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
  
  // Removed debug logs
  
  const allItems = [...currentDeposits.map(d => ({ ...d, _type: 'deposit' })), ...currentWithdrawals.map(w => ({ ...w, _type: 'withdrawal' }))];
  allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={{ ...cardStyle, padding: '28px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Payments</h2>
      
      {/* Tabs */}
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

      {/* Content */}
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

// Receipt Viewer Component - Handles signed URL for private buckets
function ReceiptViewer({ receiptUrl }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!receiptUrl) {
      setLoading(false);
      return;
    }

    // Check if URL is already a signed URL (contains 'token=' or 'signature=')
    if (receiptUrl.includes('token=') || receiptUrl.includes('signature=')) {
      setSignedUrl(receiptUrl);
      setLoading(false);
      return;
    }

    // Fetch signed URL from API
    fetch('/api/deposit/get-receipt-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt_url: receiptUrl }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.receipt_url) {
          setSignedUrl(data.receipt_url);
        } else {
          // Fallback to original URL
          setSignedUrl(receiptUrl);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching signed URL:', err);
        // Fallback to original URL
        setSignedUrl(receiptUrl);
        setLoading(false);
      });
  }, [receiptUrl]);

  if (loading) {
    return (
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading receipt...</div>
    );
  }

  if (!signedUrl) {
    return (
      <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>No receipt uploaded</div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        📄 View Receipt
      </a>
      {signedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
        <img
          src={signedUrl}
          alt="Receipt"
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
          }}
          onClick={() => window.open(signedUrl, '_blank')}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
    </div>
  );
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [binaryTrades, setBinaryTrades] = useState([]);
  const [earnSubscriptions, setEarnSubscriptions] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
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

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    setLoadingUserDetails(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user trades
      const { data: trades } = await supabase
        .from('trading_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch user earn subscriptions
      const { data: subscriptions } = await supabase
        .from('earn_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch user portfolio
      const { data: portfolio } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id);

      setUserDetails({
        trades: trades || [],
        subscriptions: subscriptions || [],
        portfolio: portfolio || [],
        balance: user.balance || 0,
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
            href="/dashboard"
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
            Back to Dashboard
          </Link>
        </div>

        <div className="flex gap-4 mb-8 border-b border-white/10">
          {['overview', 'users', 'trades', 'payments', 'messages', 'settings'].map((tab) => (
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
                            <span style={{ fontWeight: 600 }}>${parseFloat(trade.price || 0).toFixed(2)}</span>
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
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Full Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Balance</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>KYC Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Joined</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{user.email || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>{user.full_name || 'N/A'}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(user.balance || 0).toFixed(2)}</td>
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
              <div className="overflow-x-auto">
                <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>User</th>
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
                    {binaryTrades.map((trade) => (
                      <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {allUsers.find(u => u.id === trade.user_id)?.email || trade.user_id?.substring(0, 8) || 'N/A'}
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
                        <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(trade.trade_amount || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(trade.initial_price || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px', color: '#ffffff' }}>
                          {trade.last_price ? `$${parseFloat(trade.last_price).toFixed(2)}` : '—'}
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
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {trade.admin_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTrade(trade);
                                    setShowWinLostModal(true);
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(34, 197, 94, 0.2)',
                                    color: '#4ade80',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      const response = await fetch('/api/admin/binary-trade-reject', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${session.access_token}`,
                                        },
                                        body: JSON.stringify({ trade_id: trade.id }),
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        toast.success('Trade rejected');
                                        fetchAdminData();
                                      } else {
                                        toast.error(result.error || 'Failed to reject trade');
                                      }
                                    } catch (error) {
                                      toast.error('Failed to reject trade');
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#f87171',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

        {activeTab === 'messages' && (
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
            </div>
          </div>
        )}
      </main>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div
          style={{
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
            padding: '20px',
          }}
          onClick={() => setShowUserDetails(false)}
        >
          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>User Details: {selectedUser.email || selectedUser.id}</h2>
              <button
                onClick={() => setShowUserDetails(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {loadingUserDetails ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>
            ) : userDetails ? (
              <div className="space-y-6">
                {/* Balance Section */}
                <div style={{ ...cardStyle, padding: '20px', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Balance ($)</h3>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>
                      ${parseFloat(userDetails.balance || 0).toFixed(2)}
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
                <div>
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

                {/* Trades Section */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Trades ({userDetails.trades.length})</h3>
                  {userDetails.trades && userDetails.trades.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Asset</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Quantity</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Price</th>
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
                                  background: trade.trade_type === 'buy' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: trade.trade_type === 'buy' ? '#4ade80' : '#f87171',
                                }}>
                                  {trade.trade_type?.toUpperCase() || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{trade.asset_symbol || 'N/A'}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(trade.quantity || 0).toFixed(8)}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>${parseFloat(trade.price || 0).toFixed(2)}</td>
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

                {/* Earn Subscriptions Section */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Earn Subscriptions ({userDetails.subscriptions.length})</h3>
                  {userDetails.subscriptions && userDetails.subscriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Product</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>APY</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.subscriptions.map((sub) => (
                            <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{sub.product_name || 'N/A'}</td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>
                                {parseFloat(sub.amount || 0).toFixed(8)} {sub.asset_symbol || ''}
                              </td>
                              <td style={{ padding: '12px', color: '#ffffff' }}>{parseFloat(sub.apy || 0).toFixed(2)}%</td>
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
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No subscriptions found</div>
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

