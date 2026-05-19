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

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const router = useRouter();
  
  // Prevent navigation away from reset password page
  useEffect(() => {
    // Set flag immediately on mount
    if (typeof window !== 'undefined') {
      window.__onResetPasswordPage = true;
      window.__preventRedirect = true;
      console.log('🔐 [RESET PASSWORD] Set prevention flags on mount');
    }
    
    const preventNavigation = () => {
      if (hasValidSession && !success) {
        return 'Are you sure you want to leave? Your password reset is in progress.';
      }
    };
    
    window.addEventListener('beforeunload', preventNavigation);
    
    // Intercept router.push calls
    const originalPush = router.push;
    router.push = function(...args) {
      const targetPath = typeof args[0] === 'string' ? args[0] : args[0]?.pathname || '';
      console.log('🔐 [RESET PASSWORD] Router.push intercepted:', targetPath);
      console.log('🔐 [RESET PASSWORD] Current pathname:', window.location.pathname);
      console.log('🔐 [RESET PASSWORD] hasValidSession:', hasValidSession);
      console.log('🔐 [RESET PASSWORD] success:', success);
      console.log('🔐 [RESET PASSWORD] __preventRedirect:', window.__preventRedirect);
      
      // Allow redirect to login or forgot-password
      if (targetPath === '/login' || targetPath === '/forgot-password' || success) {
        console.log('🔐 [RESET PASSWORD] Allowing redirect to:', targetPath);
        return originalPush.apply(router, args);
      }
      
      // Prevent redirect if we have valid session and not success
      if (hasValidSession && !success && window.location.pathname === '/reset-password') {
        console.log('🔐 [RESET PASSWORD] ❌ BLOCKED redirect to:', targetPath);
        console.log('🔐 [RESET PASSWORD] Staying on reset-password page');
        return Promise.resolve(false);
      }
      
      return originalPush.apply(router, args);
    };
    
    return () => {
      window.removeEventListener('beforeunload', preventNavigation);
      router.push = originalPush;
      if (typeof window !== 'undefined' && !success) {
        window.__onResetPasswordPage = false;
        window.__preventRedirect = false;
      }
    };
  }, [hasValidSession, success, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;
    let handled = false;

    const markSuccess = () => {
      if (cancelled || handled) return;
      handled = true;
      setIsProcessingToken(false);
      setHasValidSession(true);
      window.__preventRedirect = true;
      window.__onResetPasswordPage = true;
      window.history.replaceState(null, '', '/reset-password');
      toast.success('Please enter your new password below');
    };

    const markFailure = (message) => {
      if (cancelled || handled) return;
      handled = true;
      setIsProcessingToken(false);
      setHasValidSession(false);
      window.history.replaceState(null, '', '/reset-password');
      toast.error(message || 'Invalid or expired password reset link. Please request a new one.');
    };

    const processRecoveryLink = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const getParam = (key) => hashParams.get(key) || queryParams.get(key);

      console.log('🔐 [RESET PASSWORD] URL:', window.location.href);
      console.log('🔐 [RESET PASSWORD] hash params:', Object.fromEntries(hashParams.entries()));
      console.log('🔐 [RESET PASSWORD] query params:', Object.fromEntries(queryParams.entries()));

      const type = getParam('type');
      if (type === 'signup') {
        toast.error('This is an email confirmation link. Redirecting to login page...');
        router.push(`/login${window.location.hash || window.location.search}`);
        return;
      }

      const error = getParam('error');
      const errorCode = getParam('error_code');
      const errorDescription = getParam('error_description');
      if (error || errorCode) {
        markFailure(errorDescription || 'Email link is invalid or has expired');
        return;
      }

      // PKCE flow (Supabase client flowType: 'pkce') — link uses ?code=
      const code = queryParams.get('code');
      if (code) {
        console.log('🔐 [RESET PASSWORD] Exchanging PKCE code for session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          console.error('🔐 [RESET PASSWORD] exchangeCodeForSession error:', exchangeError);
          markFailure(exchangeError.message);
          return;
        }
        markSuccess();
        return;
      }

      // Implicit flow — tokens in URL hash
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken && hashParams.get('type') === 'recovery') {
        console.log('🔐 [RESET PASSWORD] Setting session from hash tokens...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (sessionError) {
          markFailure(sessionError.message);
          return;
        }
        markSuccess();
        return;
      }

      // Legacy email link — token_hash or token in query
      const tokenHash = queryParams.get('token_hash') || queryParams.get('token');
      if (tokenHash && type === 'recovery') {
        console.log('🔐 [RESET PASSWORD] Verifying recovery OTP...');
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });
        if (cancelled) return;
        if (otpError) {
          markFailure(otpError.message);
          return;
        }
        markSuccess();
        return;
      }

      // detectSessionInUrl may still be processing
      await new Promise((resolve) => setTimeout(resolve, 600));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        console.log('🔐 [RESET PASSWORD] Session established after URL detection');
        markSuccess();
        return;
      }

      console.log('🔐 [RESET PASSWORD] No recovery session could be established');
      markFailure();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('🔐 [RESET PASSWORD] PASSWORD_RECOVERY event');
        markSuccess();
      }
    });

    processRecoveryLink();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
      setLoading(false);
      
      // Clear prevent redirect flag
      if (typeof window !== 'undefined') {
        window.__preventRedirect = false;
        window.__onResetPasswordPage = false;
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
        <Header />
        <main className="max-w-md mx-auto px-6 lg:px-8 pt-24">
          <div style={{ ...cardStyle, padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>✅</div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Password Reset Successful
            </h1>
            <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6', marginBottom: '32px' }}>
              Your password has been reset successfully. Redirecting to login...
            </p>
            <Link 
              href="/login" 
              style={{ 
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Go to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-md mx-auto px-6 lg:px-[200px] pt-24">
        <div style={{ ...cardStyle, padding: '40px' }}>
          <div className="text-center mb-8">
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
              Password Reset
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Reset Your Password
            </h1>
            <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6' }}>
              {isProcessingToken ? 'Processing reset link...' : hasValidSession ? 'Enter your new password below.' : 'Invalid or expired password reset link. Please request a new one.'}
            </p>
          </div>

          {isProcessingToken && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#60a5fa' }}>
              <div style={{ fontSize: '14px' }}>Loading...</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isProcessingToken || !hasValidSession}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
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
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isProcessingToken || !hasValidSession}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 16px',
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isProcessingToken || !hasValidSession}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: (loading || isProcessingToken || !hasValidSession) ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: (loading || isProcessingToken || !hasValidSession) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: (loading || isProcessingToken || !hasValidSession) ? 0.7 : 1,
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="text-center mt-8 space-y-3">
            {!hasValidSession && !isProcessingToken && (
              <Link 
                href="/forgot-password" 
                style={{ 
                  display: 'inline-block',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  marginBottom: '12px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 10px 20px rgba(16, 185, 129, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Request New Reset Link
              </Link>
            )}
            <div>
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
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;






