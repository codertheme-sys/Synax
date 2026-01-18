import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for email confirmation token in URL on mount
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check for hash fragment (Supabase uses #access_token=... or #error=...)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for access_token in hash (successful confirmation)
        if (hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');
          
          // Check query params for type (Supabase verify endpoint may have type in query, not hash)
          const urlSearchParams = new URLSearchParams(window.location.search);
          const queryType = urlSearchParams.get('type');
          const actualType = type || queryType;
          
          console.log('🔐 [LOGIN] Email confirmation check:', {
            hasAccessToken: !!accessToken,
            hashType: type,
            queryType,
            actualType
          });
          
          // If access_token exists, treat as email confirmation (even if type is missing)
          // Supabase verify endpoint doesn't always include type in hash
          if (accessToken && (actualType === 'signup' || !actualType)) {
            // Email confirmed successfully
            // CRITICAL: Supabase's verify endpoint automatically sets session when redirecting
            // We need to clear the session to prevent auto-login
            console.log('🔐 [LOGIN] ✅ Email confirmation detected (type=' + (actualType || 'missing') + '), clearing auto-set session');
            try {
              // Sign out to prevent auto-login (Supabase verify endpoint sets session automatically)
              await supabase.auth.signOut();
              
              // Wait a moment for sign out to complete
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Show success message
              toast.success('Email confirmed successfully! Please log in with your credentials.');
              
              // Clear the hash from URL
              window.history.replaceState(null, '', '/login');
            } catch (error) {
              console.error('🔐 [LOGIN] Error processing confirmation:', error);
              toast.error('Email confirmation processed, but there was an issue. Please try logging in.');
              // Clear the hash from URL anyway
              window.history.replaceState(null, '', '/login');
            }
          }
        }
        
        // Check for error in hash (expired or invalid token)
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1));
          const error = params.get('error');
          const errorDescription = params.get('error_description');
          
          if (error === 'access_denied' || errorDescription?.includes('expired')) {
            toast.error('Confirmation link has expired. Please request a new confirmation email.');
            // Clear the hash from URL
            window.history.replaceState(null, '', '/login');
          }
        }
        
        // Check for confirmation success in query params
        if (searchParams.get('confirmed') === 'true') {
          toast.success('Email confirmed successfully! You can now log in.');
          // Clear the query param
          router.replace('/login', undefined, { shallow: true });
        }
      }
    };

    handleEmailConfirmation();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    // Use async/await approach for better error handling
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Handle errors first - prevent Next.js error overlay
      if (error) {
        setLoading(false);
        
        const errorMsg = String(error.message || '').toLowerCase();
        const errorCode = String(error.code || '').toLowerCase();
        const errorName = String(error.name || '').toLowerCase();
        
        // FIRST: Check for invalid credentials (most common for deleted users)
        const isInvalidCredentials = 
          errorMsg.includes('invalid login credentials') ||
          errorMsg.includes('invalid credentials') ||
          errorMsg.includes('wrong password') ||
          errorMsg.includes('user not found') ||
          errorCode === 'invalid_credentials' ||
          (error.status === 400 && errorMsg.includes('invalid'));
        
        if (isInvalidCredentials) {
          toast.error('Invalid email or password');
          return;
        }
        
        // SECOND: Check for email confirmation error (more specific)
        const isEmailNotConfirmed = 
          errorMsg.includes('email not confirmed') || 
          errorMsg.includes('email_not_confirmed') || 
          errorCode === 'email_not_confirmed' ||
          (errorMsg.includes('email') && errorMsg.includes('confirm') && !errorMsg.includes('invalid'));
        
        if (isEmailNotConfirmed) {
          // Show modal instead of error page - prevent error from propagating
          setShowEmailModal(true);
          return;
        }
        
        // More specific error messages
        if (errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
          toast.error('Connection error. Please check your internet connection and Supabase configuration.');
          return;
        } else {
          // Default: show generic error message
          toast.error(String(error.message || 'Invalid email or password'));
          return;
        }
      }

      if (data?.user) {
        // STRICT: Double-check email confirmation status from user object
        const isEmailConfirmed = data.user.email_confirmed_at !== null && data.user.email_confirmed_at !== undefined;
        
        if (!isEmailConfirmed) {
          // Email not confirmed - SIGN OUT immediately and show modal
          await supabase.auth.signOut();
          setShowEmailModal(true);
          setLoading(false);
          toast.error('Please verify your email before logging in');
          return;
        }
        
        // Additional check: Verify session user also has confirmed email
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user && !currentSession.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setShowEmailModal(true);
          setLoading(false);
          toast.error('Please verify your email before logging in');
          return;
        }
        
        toast.success('Login successful!');
        // Clear form
        setEmail('');
        setPassword('');
        // Wait a bit before redirect to ensure session is set
        setTimeout(() => {
          router.push('/home');
        }, 500);
      } else {
        toast.error('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      
      // Prevent error from propagating to Next.js error boundary
      const errorMsg = String(error?.message || '').toLowerCase();
      const errorCode = String(error?.code || '').toLowerCase();
      
      if (errorMsg.includes('fetch') || error?.name === 'TypeError' || errorMsg.includes('failed to fetch')) {
        toast.error('Network error. Please check your internet connection and Supabase configuration.');
      } else if (
        errorMsg.includes('invalid login credentials') ||
        errorMsg.includes('invalid credentials') ||
        errorMsg.includes('wrong password') ||
        errorMsg.includes('user not found') ||
        errorCode === 'invalid_credentials'
      ) {
        // Invalid credentials
        toast.error('Invalid email or password');
      } else if (
        errorMsg.includes('email not confirmed') || 
        errorMsg.includes('email_not_confirmed') || 
        errorCode === 'email_not_confirmed' ||
        (errorMsg.includes('email') && errorMsg.includes('confirm') && !errorMsg.includes('invalid'))
      ) {
        // Show modal for email confirmation
        setShowEmailModal(true);
      } else {
        toast.error(String(error?.message || 'An error occurred. Please try again.'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
      <Header />
      <div className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ ...cardStyle, padding: isMobile ? '24px' : '48px', maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-6 sm:mb-8">
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: isMobile ? '13px' : '15px', color: '#9ca3af' }}>
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInvalid={(e) => {
                e.preventDefault();
                if (!e.target.value) {
                  toast.error('Please enter your email address');
                } else if (!e.target.value.includes('@')) {
                  toast.error('Please enter a valid email address');
                } else {
                  toast.error('Please enter a valid email address');
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '15px',
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
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 45px 12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
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
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', cursor: 'pointer' }}>
              <input type="checkbox" style={{ marginRight: '8px' }} />
              Remember me
            </label>
            <Link href="/forgot-password" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="text-center mt-6" style={{ fontSize: '14px', color: '#9ca3af' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowEmailModal(false)}
        >
          <div
            style={{
              ...cardStyle,
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEmailModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Email Confirmation Required
              </h2>
              <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.6' }}>
                Your email address has not been confirmed yet.
              </p>
            </div>

            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <p style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.7', margin: 0 }}>
                Please check your email inbox (<strong style={{ color: '#ffffff' }}>{email}</strong>) and click the confirmation link to verify your account before logging in.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Close
              </button>
              <button
                onClick={async () => {
                  try {
                    const { error: resendError } = await supabase.auth.resend({
                      type: 'signup',
                      email: email.trim(),
                    });
                    if (resendError) {
                      toast.error('Failed to resend confirmation email. Please try again later.');
                    } else {
                      toast.success('Confirmation email sent! Please check your inbox.');
                      setShowEmailModal(false);
                    }
                  } catch (err) {
                    toast.error('Failed to resend confirmation email. Please try again later.');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Resend Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
