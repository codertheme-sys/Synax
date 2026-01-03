import React, { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

const withdrawalMethods = [
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', min: 50, fee: '2.5%' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿', min: 20, fee: '1.5%' },
  { id: 'paypal', name: 'PayPal', icon: '💳', min: 25, fee: '3%' },
];

function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [loading, setLoading] = useState(false);
  const balance = 12800;

  const selectedMethod = withdrawalMethods.find((m) => m.id === method);
  const fee = selectedMethod ? (parseFloat(amount || 0) * parseFloat(selectedMethod.fee.replace('%', '')) / 100) : 0;
  const receive = parseFloat(amount || 0) - fee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > balance) {
      alert('Insufficient balance');
      return;
    }
    if (parseFloat(amount) < selectedMethod.min) {
      alert(`Minimum withdrawal is $${selectedMethod.min}`);
      return;
    }
    setLoading(true);
    // TODO: Implement withdrawal processing
    setTimeout(() => {
      setLoading(false);
      alert('Withdrawal request submitted!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center mb-12">
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
            Withdraw
          </p>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Withdraw funds
          </h1>
          <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Transfer your funds to your preferred withdrawal method.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div style={{ ...cardStyle, padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Withdrawal Method</h2>
            <div className="space-y-3">
              {withdrawalMethods.map((wm) => (
                <button
                  key={wm.id}
                  onClick={() => setMethod(wm.id)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: method === wm.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: method === wm.id ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{wm.icon}</span>
                    <div>
                      <div>{wm.name}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>
                        Min: ${wm.min} • Fee: {wm.fee}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Withdrawal Amount</h2>
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
                  min={selectedMethod.min}
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
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>Available Balance</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 600 }}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>Withdrawal Fee</span>
                  <span style={{ color: '#f87171', fontSize: '14px', fontWeight: 600 }}>${fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ color: '#9ca3af', fontSize: '14px' }}>You'll Receive</span>
                  <span style={{ color: '#4ade80', fontSize: '16px', fontWeight: 700 }}>${receive.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) < selectedMethod.min || parseFloat(amount) > balance}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: loading || !amount || parseFloat(amount) < selectedMethod.min || parseFloat(amount) > balance ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading || !amount || parseFloat(amount) < selectedMethod.min || parseFloat(amount) > balance ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
                }}
              >
                {loading ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

export default WithdrawPage;

