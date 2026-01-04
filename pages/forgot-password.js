import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 [Forgot Password] Starting password reset request...');
      console.log('🔐 [Forgot Password] Email:', email);
      console.log('🔐 [Forgot Password] Redirect URL:', `${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      console.log('🔐 [Forgot Password] Supabase response - data:', data);
      console.log('🔐 [Forgot Password] Supabase response - error:', error);

      if (error) {
        console.error('❌ [Forgot Password] Password reset error:', error);
        console.error('❌ [Forgot Password] Error code:', error.code);
        console.error('❌ [Forgot Password] Error message:', error.message);
        console.error('❌ [Forgot Password] Error status:', error.status);
        console.error('❌ [Forgot Password] Full error object:', JSON.stringify(error, null, 2));
        toast.error(error.message || 'Failed to send password reset email');
        setLoading(false);
        return;
      }

      console.log('✅ [Forgot Password] Password reset email sent successfully');
      setEmailSent(true);
      toast.success('Password reset email sent! Please check your inbox.');
      setLoading(false);
    } catch (error) {
      console.error('❌ [Forgot Password] Unexpected error:', error);
      console.error('❌ [Forgot Password] Error type:', typeof error);
      console.error('❌ [Forgot Password] Error name:', error?.name);
      console.error('❌ [Forgot Password] Error message:', error?.message);
      console.error('❌ [Forgot Password] Error stack:', error?.stack);
      console.error('❌ [Forgot Password] Full error object:', JSON.stringify(error, null, 2));
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="mx-auto pt-24" style={{ 
        maxWidth: '600px', 
        paddingLeft: isMobile ? '24px' : '300px', 
        paddingRight: isMobile ? '24px' : '300px' 
      }}>
        <div style={{ ...cardStyle, padding: '40px' }}>
          {!emailSent ? (
            <>
              <div className="text-center mb-8">
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
                  Password Reset
                </p>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  Forgot Password?
                </h1>
                <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>📧</div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                Check Your Email
              </h1>
              <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', marginBottom: '32px' }}>
                We've sent a password reset link to <strong style={{ color: '#ffffff' }}>{email}</strong>. Please check your inbox and click the link to reset your password.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Try Another Email
              </button>
            </div>
          )}

          <div className="text-center mt-8">
            <Link 
              href="/login" 
              style={{ 
                color: '#60a5fa', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#93c5fd'}
              onMouseLeave={(e) => e.target.style.color = '#60a5fa'}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;

