import React, { useState, useEffect } from 'react';

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

export default ReceiptViewer;






