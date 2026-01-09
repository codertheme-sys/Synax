import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

export default ContactMessageCard;



