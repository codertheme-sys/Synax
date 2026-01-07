import React, { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
];

function DepositPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Implement payment processing
      toast.success('Deposit request submitted successfully!');
      setAmount('');
    } catch (error) {
      toast.error('Failed to submit deposit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center mb-12">
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
            Deposit
          </p>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Add funds to your account
          </h1>
          <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Choose your preferred payment method and deposit funds securely.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div style={{ ...cardStyle, padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Payment Method</h2>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: method === pm.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: method === pm.id ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{pm.icon}</span>
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Deposit Amount</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="10"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  placeholder="0.00"
                />
              </div>

              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>Current Balance</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>$12,800.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>After Deposit</span>
                  <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 600 }}>
                    ${(12800 + parseFloat(amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) < 10}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: loading || !amount || parseFloat(amount) < 10 ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading || !amount || parseFloat(amount) < 10 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
                }}
              >
                {loading ? 'Processing...' : 'Deposit Funds'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/home" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default DepositPage;

