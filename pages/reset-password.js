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
    console.log('🔐 [RESET PASSWORD] ========== PAGE MOUNTED ==========');
    console.log('🔐 [RESET PASSWORD] Timestamp:', new Date().toISOString());
    console.log('🔐 [RESET PASSWORD] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('🔐 [RESET PASSWORD] Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
    console.log('🔐 [RESET PASSWORD] Current hash:', typeof window !== 'undefined' ? window.location.hash : 'N/A');
    console.log('🔐 [RESET PASSWORD] Current search:', typeof window !== 'undefined' ? window.location.search : 'N/A');
    console.log('🔐 [RESET PASSWORD] Router pathname:', router.pathname);
    console.log('🔐 [RESET PASSWORD] Router asPath:', router.asPath);
    console.log('🔐 [RESET PASSWORD] Router query:', router.query);
    
    // Check for error in URL hash first
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const urlParams = new URLSearchParams(hash.substring(1)); // Remove # from hash
    
    console.log('🔐 [RESET PASSWORD] Parsed hash:', hash);
    console.log('🔐 [RESET PASSWORD] URL params from hash:', Object.fromEntries(urlParams.entries()));
    
    // Check for error parameters
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');
    
    if (error || errorCode) {
      console.error('🔐 [RESET PASSWORD] ❌ ERROR DETECTED IN URL:', { error, errorCode, errorDescription });
      console.log('🔐 [RESET PASSWORD] Showing error message and staying on page');
      toast.error(errorDescription || 'Invalid or expired password reset link. Please request a new one.');
      setIsProcessingToken(false);
      setHasValidSession(false);
      
      // Clear the hash to clean up the URL
      const newUrl = '/reset-password';
      console.log('🔐 [RESET PASSWORD] Replacing URL hash with:', newUrl);
      window.history.replaceState(null, '', newUrl);
      
      // Don't redirect - stay on page and show error
      return;
    }
    
    // Parse URL hash for password reset token
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    console.log('🔐 [RESET PASSWORD] Token check:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      type: type,
      accessTokenLength: accessToken ? accessToken.length : 0,
      refreshTokenLength: refreshToken ? refreshToken.length : 0
    });
    
    // Check if we have a valid recovery token in hash
    if (accessToken && refreshToken && type === 'recovery') {
      console.log('🔐 [RESET PASSWORD] ✅ Found recovery tokens in URL hash');
      console.log('🔐 [RESET PASSWORD] Setting session with recovery token...');
      
      // Check current session before setting new one
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        console.log('🔐 [RESET PASSWORD] Current session before setSession:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          email: currentSession?.user?.email
        });
      });
      
      // Set session from recovery token (this allows password update)
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        console.log('🔐 [RESET PASSWORD] setSession response:', {
          hasData: !!data,
          hasError: !!error,
          errorMessage: error?.message,
          userId: data?.user?.id,
          email: data?.user?.email,
          sessionExists: !!data?.session
        });
        
        if (error) {
          console.error('🔐 [RESET PASSWORD] ❌ Error setting session:', error);
          console.log('🔐 [RESET PASSWORD] Showing error message and staying on page');
          toast.error(error.message || 'Invalid or expired password reset link. Please request a new one.');
          setIsProcessingToken(false);
          setHasValidSession(false);
          
          // Clear the hash to clean up the URL
          const newUrl = '/reset-password';
          console.log('🔐 [RESET PASSWORD] Replacing URL hash with:', newUrl);
          window.history.replaceState(null, '', newUrl);
          
          // Don't redirect - stay on page and show error
        } else {
          // Session set successfully, user can now reset password
          console.log('🔐 [RESET PASSWORD] ✅ Recovery session set successfully');
          console.log('🔐 [RESET PASSWORD] Session data:', {
            userId: data?.user?.id,
            email: data?.user?.email,
            sessionToken: data?.session?.access_token ? 'Present' : 'Missing'
          });
          
          setIsProcessingToken(false);
          setHasValidSession(true);
          
          // Clear the hash to clean up the URL but stay on reset-password page
          const newUrl = '/reset-password';
          console.log('🔐 [RESET PASSWORD] Replacing URL hash with:', newUrl);
          window.history.replaceState(null, '', newUrl);
          console.log('🔐 [RESET PASSWORD] URL after replaceState:', window.location.href);
          
          // Set flag to prevent redirects
          if (typeof window !== 'undefined') {
            window.__preventRedirect = true;
            window.__onResetPasswordPage = true;
            console.log('🔐 [RESET PASSWORD] Set redirect prevention flags:', {
              __preventRedirect: window.__preventRedirect,
              __onResetPasswordPage: window.__onResetPasswordPage
            });
          }
          
          toast.success('Please enter your new password below');
          
          // Verify session is still set after a short delay
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: verifySession } }) => {
              console.log('🔐 [RESET PASSWORD] Session verification after 1s:', {
                hasSession: !!verifySession,
                userId: verifySession?.user?.id,
                email: verifySession?.user?.email,
                currentPath: window.location.pathname
              });
            });
          }, 1000);
        }
      });
    } else {
      // Check query params (for copied links)
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get('token');
      const queryType = queryParams.get('type');
      
      console.log('🔐 [RESET PASSWORD] Query params check:', {
        hasToken: !!token,
        queryType: queryType,
        allQueryParams: Object.fromEntries(queryParams.entries())
      });
      
      if (token && queryType === 'recovery') {
        // Handle query param token if needed
        console.log('🔐 [RESET PASSWORD] Found recovery token in query params');
        setIsProcessingToken(false);
      } else {
        // No valid token in hash or query params
        // Check if user already has a valid session (they might have clicked link before)
        console.log('🔐 [RESET PASSWORD] No tokens found, checking existing session...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('🔐 [RESET PASSWORD] Existing session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email
          });
          
          setIsProcessingToken(false);
          if (!session) {
            console.log('🔐 [RESET PASSWORD] ❌ No valid session found');
            console.log('🔐 [RESET PASSWORD] Showing error message and staying on page');
            toast.error('Invalid or expired password reset link. Please request a new one.');
            setHasValidSession(false);
            // Don't redirect - stay on page and show error
          } else {
            console.log('🔐 [RESET PASSWORD] ✅ Valid session found, user can reset password');
            setHasValidSession(true);
            if (typeof window !== 'undefined') {
              window.__preventRedirect = true;
              window.__onResetPasswordPage = true;
            }
          }
        });
      }
    }
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
      <main className="max-w-md mx-auto px-6 lg:px-8 pt-24">
        <div style={{ ...cardStyle, padding: '40px' }}>
          <div className="text-center mb-8">
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>
              Password Reset
            </p>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', lineHeight: '1.1', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Reset Your Password
            </h1>
            <p style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.6' }}>
              Enter your new password below.
            </p>
          </div>

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

export default ResetPasswordPage;






