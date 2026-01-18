// pages/_app.js
import '../styles/globals.css'

// Global CSS for select dropdown options (dark theme)
if (typeof document !== 'undefined') {
  const styleId = 'admin-select-dropdown-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      select option {
        background-color: #0f1124 !important;
        color: #ffffff !important;
      }
      select:focus option:checked {
        background-color: rgba(59, 130, 246, 0.3) !important;
      }
      select option:hover {
        background-color: rgba(59, 130, 246, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }
};
import { Toaster, toast } from 'react-hot-toast';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import ChatWidget from '../components/ChatWidget';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastCheckedAlerts, setLastCheckedAlerts] = useState(new Set());

  useEffect(() => {
    // Clean up TradingView widgets when navigating away from trade page
    const cleanupTradingView = () => {
      if (router.pathname !== '/trade') {
        // Remove all TradingView widgets from DOM
        const allWidgets = document.querySelectorAll('.tradingview-widget-container, .tradingview-widget-container__widget, [id*="tradingview"]');
        allWidgets.forEach(widget => {
          const tradePage = widget.closest('[data-trade-page]');
          if (!tradePage) {
            widget.innerHTML = '';
            widget.remove();
          }
        });
        // Also remove any iframes created by TradingView
        const iframes = document.querySelectorAll('iframe[src*="tradingview"], iframe[src*="screener"]');
        iframes.forEach(iframe => {
          const tradePage = iframe.closest('[data-trade-page]');
          if (!tradePage) {
            iframe.remove();
          }
        });
        // Remove any script tags related to TradingView screener
        const scripts = document.querySelectorAll('script[src*="screener"], script[id*="tradingview-screener"]');
        scripts.forEach(script => {
          const tradePage = script.closest('[data-trade-page]');
          if (!tradePage && script.id && script.id.includes('tradingview-screener')) {
            script.remove();
          }
        });
      }
    };

    // Run cleanup immediately and on route change
    cleanupTradingView();
    
    // Also run cleanup after a short delay to catch any dynamically loaded widgets
    const timeoutId = setTimeout(cleanupTradingView, 100);

    const elements = Array.from(document.querySelectorAll('[data-reveal]'));

    // Home sayfası: animasyon kapalı, içerik direkt görünür
    if (router.pathname === '/') {
      document.body.classList.add('home');
      elements.forEach((el) => el.classList.add('reveal-show'));
      return () => {
        document.body.classList.remove('home');
      };
    } else {
      document.body.classList.remove('home');
    }

    const isInViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-show');
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => {
      observer.observe(el);
      // if already in viewport on load, reveal immediately
      if (isInViewport(el)) {
        el.classList.add('reveal-show');
      }
    });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      clearTimeout(timeoutId);
    };
  }, [router.pathname]);


  // Check for email confirmation and password reset tokens in URL hash
  // This must run BEFORE component mount to catch redirects early
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkHashForAuthRedirects = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const search = window.location.search;
      const fullUrl = window.location.href;
      
      console.log('🔐 [APP] ========== HASH CHECK START ==========');
      console.log('🔐 [APP] Full URL:', fullUrl);
      console.log('🔐 [APP] Pathname:', pathname);
      console.log('🔐 [APP] Search:', search);
      console.log('🔐 [APP] Hash:', hash);
      console.log('🔐 [APP] Hash length:', hash?.length || 0);
      
      // Skip if already on target pages
      if (pathname === '/reset-password' || pathname === '/login') {
        console.log('🔐 [APP] ⏭️ Already on target page, skipping hash check');
        return;
      }
      
      if (!hash || hash.length < 2) {
        console.log('🔐 [APP] ⏭️ No hash or hash too short, skipping');
        return; // No hash or just #
      }
      
      const urlParams = new URLSearchParams(hash.substring(1)); // Remove # from hash
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');
      const error = urlParams.get('error');
      const errorCode = urlParams.get('error_code');
      const errorDescription = urlParams.get('error_description');
      
      console.log('🔐 [APP] Hash parameters:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type,
        error,
        errorCode,
        errorDescription,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      // FIRST: Check URL query params for type (Supabase verify endpoint may have type in query, not hash)
      const urlSearchParams = new URLSearchParams(search);
      const queryType = urlSearchParams.get('type');
      const queryToken = urlSearchParams.get('token');
      
      console.log('🔐 [APP] Query parameters:', {
        queryType,
        queryToken: queryToken ? 'Present' : 'Missing'
      });
      
      // Combine type from both hash and query params
      const actualType = type || queryType;
      
      console.log('🔐 [APP] Type resolution:', { 
        hashType: type, 
        queryType, 
        actualType,
        finalDecision: actualType || 'NO TYPE FOUND'
      });
      
      // CRITICAL: If access_token exists, this is likely email confirmation (even without type)
      // Supabase verify endpoint doesn't always include type in hash
      if (accessToken) {
        console.log('🔐 [APP] ✅ Access token detected in hash');
        
        // If type=signup explicitly, definitely email confirmation
        if (actualType === 'signup') {
          console.log('🔐 [APP] ✅ Type=signup confirmed, redirecting to /login');
          window.location.replace(`/login${hash}`);
          return;
        }
        
        // If type=recovery explicitly, definitely password reset
        if (actualType === 'recovery') {
          console.log('🔐 [APP] ✅ Type=recovery confirmed, redirecting to /reset-password');
          window.location.replace(`/reset-password${hash}`);
          return;
        }
        
        // If no type but access_token exists, assume email confirmation (default behavior)
        // This handles the case where Supabase verify endpoint doesn't include type in hash
        console.log('🔐 [APP] ⚠️ Access token found but no type parameter');
        console.log('🔐 [APP] ⚠️ Assuming email confirmation (default), redirecting to /login');
        window.location.replace(`/login${hash}`);
        return;
      }
      
      // FIRST: Check if this is an email confirmation link (type=signup) - even if expired
      if (actualType === 'signup') {
        console.log('🔐 [APP] ✅ Email confirmation link detected (type=signup), redirecting to /login');
        // Use window.location.replace for immediate redirect (more reliable than router.push)
        window.location.replace(`/login${hash}`);
        return;
      }
      
      // SECOND: Check if this is a password reset token (type=recovery)
      // CRITICAL: Only treat as reset password if EXPLICITLY type=recovery
      // If type is missing, assume it's email confirmation (not reset password!)
      if (actualType === 'recovery' && accessToken && refreshToken) {
        console.log('🔐 [APP] ✅ Password reset token detected (type=recovery + tokens), redirecting to /reset-password');
        window.location.replace(`/reset-password${hash}`);
        return;
      }
      
      // THIRD: Handle errors (expired tokens)
      if (error === 'access_denied' && (errorCode === 'otp_expired' || errorCode === 'token_expired')) {
        console.log('🔐 [APP] ⚠️ Expired token error detected');
        console.log('🔐 [APP] Error details:', { error, errorCode, errorDescription, actualType });
        
        if (actualType === 'recovery') {
          console.log('🔐 [APP] ✅ Expired password reset token (type=recovery), redirecting to /reset-password');
          window.location.replace(`/reset-password${hash}`);
        } else {
          // Default: treat as expired email confirmation
          console.log('🔐 [APP] ⚠️ Expired email confirmation token (no type or type!=recovery), redirecting to /login');
          window.location.replace(`/login${hash}`);
        }
        return;
      }
      
      console.log('🔐 [APP] ⚠️ Hash found but no matching pattern, staying on current page');
      console.log('🔐 [APP] ========== HASH CHECK END ==========');
    };
    
    // Check immediately (critical - must run before page renders)
    checkHashForAuthRedirects();
    
    // Also listen for hash changes (in case hash is added after page load)
    window.addEventListener('hashchange', checkHashForAuthRedirects);
    
    return () => {
      window.removeEventListener('hashchange', checkHashForAuthRedirects);
    };
  }, []); // Empty dependency array - run once on mount

  // Check for user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : router.pathname;
      const currentUrl = typeof window !== 'undefined' ? window.location.href : 'N/A';
      
      console.log('🔐 [AUTH STATE CHANGE] ========== EVENT TRIGGERED ==========');
      console.log('🔐 [AUTH STATE CHANGE] Event:', event);
      console.log('🔐 [AUTH STATE CHANGE] Timestamp:', new Date().toISOString());
      console.log('🔐 [AUTH STATE CHANGE] Current pathname:', currentPath);
      console.log('🔐 [AUTH STATE CHANGE] Current URL:', currentUrl);
      console.log('🔐 [AUTH STATE CHANGE] Router pathname:', router.pathname);
      console.log('🔐 [AUTH STATE CHANGE] Has session:', !!session);
      console.log('🔐 [AUTH STATE CHANGE] User ID:', session?.user?.id);
      console.log('🔐 [AUTH STATE CHANGE] User email:', session?.user?.email);
      console.log('🔐 [AUTH STATE CHANGE] __preventRedirect flag:', typeof window !== 'undefined' ? window.__preventRedirect : 'N/A');
      console.log('🔐 [AUTH STATE CHANGE] __onResetPasswordPage flag:', typeof window !== 'undefined' ? window.__onResetPasswordPage : 'N/A');
      
      // CRITICAL: If session was set by email confirmation (type=signup), clear it immediately
      if (event === 'SIGNED_IN' && session && currentPath === '/') {
        if (typeof window !== 'undefined') {
          const hash = window.location.hash || '';
          const urlParams = new URLSearchParams(hash.substring(1));
          const type = urlParams.get('type');
          const urlSearchParams = new URLSearchParams(window.location.search);
          const queryType = urlSearchParams.get('type');
          const actualType = type || queryType;
          
          // Check if this is from email confirmation (type=signup in hash or query, or hash contains access_token)
          const isEmailConfirmation = actualType === 'signup' || (hash && hash.includes('access_token'));
          
          if (isEmailConfirmation) {
            console.log('🔐 [AUTH STATE CHANGE] ⚠️ Email confirmation auto-login detected, clearing session and redirecting to /login');
            console.log('🔐 [AUTH STATE CHANGE] Hash:', hash);
            console.log('🔐 [AUTH STATE CHANGE] Type:', actualType);
            
            // Clear session immediately to prevent auto-login
            await supabase.auth.signOut();
            
            // Wait a moment for sign out to complete
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Redirect to login page with hash preserved if it exists
            const redirectUrl = hash ? `/login${hash}` : '/login';
            window.location.replace(redirectUrl);
            return;
          }
        }
      }
      
      setUser(session?.user || null);
      
      // CRITICAL: Don't redirect if we're on reset-password page (let the page handle it)
      if (currentPath === '/reset-password' || router.pathname === '/reset-password') {
        console.log('🔐 [AUTH STATE CHANGE] ✅ On reset-password page, preventing any redirects');
        console.log('🔐 [AUTH STATE CHANGE] Event type:', event);
        console.log('🔐 [AUTH STATE CHANGE] Session exists:', !!session);
        
        // Prevent any automatic redirects
        if (typeof window !== 'undefined') {
          window.__preventRedirect = true;
          window.__onResetPasswordPage = true;
          console.log('🔐 [AUTH STATE CHANGE] Set redirect prevention flags');
        }
        
        // Don't do anything else, just return
        console.log('🔐 [AUTH STATE CHANGE] Returning early - no redirect');
        return;
      }
      
      // Clear prevent redirect flag if not on reset-password page
      if (typeof window !== 'undefined' && currentPath !== '/reset-password' && router.pathname !== '/reset-password') {
        if (window.__preventRedirect || window.__onResetPasswordPage) {
          console.log('🔐 [AUTH STATE CHANGE] Clearing redirect prevention flags (not on reset-password page)');
        }
        window.__preventRedirect = false;
        window.__onResetPasswordPage = false;
      }
      
      console.log('🔐 [AUTH STATE CHANGE] ========== EVENT HANDLED ==========');
    });
    
    // Also intercept router events to prevent navigation
    const handleRouteChangeStart = (url) => {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : router.pathname;
      console.log('🔐 [ROUTER] Route change start:', url);
      console.log('🔐 [ROUTER] Current path:', currentPath);
      console.log('🔐 [ROUTER] __preventRedirect:', typeof window !== 'undefined' ? window.__preventRedirect : 'N/A');
      
      if (currentPath === '/reset-password' && typeof window !== 'undefined' && window.__preventRedirect) {
        const targetPath = url.split('?')[0];
        if (targetPath !== '/reset-password' && targetPath !== '/login' && targetPath !== '/forgot-password') {
          console.log('🔐 [ROUTER] ❌ BLOCKED route change from /reset-password to:', targetPath);
          router.events.emit('routeChangeError', new Error('Navigation blocked'), url, { shallow: false });
          throw new Error('Navigation blocked - on reset password page');
        }
      }
    };
    
    router.events.on('routeChangeStart', handleRouteChangeStart);
    
    return () => {
      subscription.unsubscribe();
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.is_admin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Admin notifications for new chat/contact messages
  useEffect(() => {
    if (!isAdmin || !user) return;

    // Play notification sound
    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    };

    // Subscribe to new chat messages
    const chatChannel = supabase
      .channel('admin_chat_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'is_admin=eq.false',
        },
        (payload) => {
          console.log('New chat message for admin:', payload);
          playNotificationSound();
          toast.success(
            `💬 New chat message from ${payload.new.user_name || payload.new.user_email || 'User'}`,
            {
              duration: 5000,
              position: 'top-right',
              style: {
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                border: '2px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4)',
              },
              icon: '💬',
            }
          );
        }
      )
      .subscribe();

    // Subscribe to new contact messages
    const contactChannel = supabase
      .channel('admin_contact_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
        },
        (payload) => {
          console.log('New contact message for admin:', payload);
          playNotificationSound();
          toast.success(
            `📧 New contact message from ${payload.new.full_name || payload.new.email || 'User'}`,
            {
              duration: 5000,
              position: 'top-right',
              style: {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(139, 92, 246, 0.4)',
              },
              icon: '📧',
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(contactChannel);
    };
  }, [isAdmin, user]);

  // Global Price Alert System - Check active alerts and trigger them
  useEffect(() => {
    if (!user) return;

    // Use ref to track processing state and prevent duplicate triggers
    const processingAlerts = new Set();
    const shownAlerts = new Set();

    const checkAndTriggerAlerts = async () => {
      // Only check when tab is visible
      if (document.hidden) {
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch active alerts
        const alertsResponse = await fetch('/api/alerts/list?status=active', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const alertsResult = await alertsResponse.json();
        if (!alertsResult.success || !alertsResult.data || alertsResult.data.length === 0) {
          return;
        }

        // Fetch current prices
        const pricesResponse = await fetch('/api/prices/crypto');
        const pricesResult = await pricesResponse.json();
        
        const goldResponse = await fetch('/api/prices/gold');
        const goldResult = await goldResponse.json();

        if (!pricesResult.success || !goldResult.success) {
          return;
        }

        // Check each active alert
        for (const alert of alertsResult.data) {
          // Skip if already processing or shown
          if (processingAlerts.has(alert.id) || shownAlerts.has(alert.id)) {
            continue;
          }

          let currentPrice = 0;
          
          // Get current price based on asset type
          if (alert.asset_type === 'crypto') {
            const asset = pricesResult.data?.find(a => 
              a.symbol?.toUpperCase() === alert.asset_symbol.toUpperCase() ||
              a.id?.toUpperCase() === alert.asset_symbol.toUpperCase()
            );
            if (asset) {
              currentPrice = parseFloat(asset.current_price || asset.price || 0);
            }
          } else if (alert.asset_type === 'gold') {
            currentPrice = parseFloat(goldResult.data?.current_price || goldResult.data?.price || 0);
          }

          if (currentPrice === 0) {
            continue; // Skip if price not found
          }

          // Check condition
          let shouldTrigger = false;
          const conditionValue = parseFloat(alert.condition_value);

          switch (alert.condition_operator) {
            case '>':
              shouldTrigger = currentPrice > conditionValue;
              break;
            case '>=':
              shouldTrigger = currentPrice >= conditionValue;
              break;
            case '<':
              shouldTrigger = currentPrice < conditionValue;
              break;
            case '<=':
              shouldTrigger = currentPrice <= conditionValue;
              break;
            case '==':
              shouldTrigger = Math.abs(currentPrice - conditionValue) < 0.01;
              break;
            default:
              shouldTrigger = false;
          }

          if (shouldTrigger) {
            // Mark as processing to prevent duplicate triggers
            processingAlerts.add(alert.id);

            // Update alert status in database first
            try {
              const updateResponse = await fetch('/api/alerts/update', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  alertId: alert.id,
                  status: 'triggered',
                  triggered_at: new Date().toISOString(),
                }),
              });
              
              const updateResult = await updateResponse.json();
              if (updateResult.success) {
                console.log(`Alert triggered: ${alert.asset_symbol} ${alert.condition_operator} ${conditionValue} (Current: ${currentPrice})`);
                
                // Mark as shown immediately to prevent duplicate
                shownAlerts.add(alert.id);
                setLastCheckedAlerts(prev => new Set([...prev, alert.id]));

                // Show toast notification
                const conditionText = `${alert.asset_symbol} ${alert.condition_operator} $${conditionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                const currentPriceText = `Current: $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                const toastId = toast.error(
                  `🚨 Price Alert Triggered!\n${conditionText}\n${currentPriceText}`,
                  {
                    duration: 15000, // Show for 15 seconds
                    style: {
                      background: 'rgba(239, 68, 68, 0.95)',
                      color: '#ffffff',
                      border: '3px solid #ef4444',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      fontSize: '15px',
                      fontWeight: 700,
                      boxShadow: '0 8px 16px rgba(239, 68, 68, 0.5)',
                      whiteSpace: 'pre-line',
                    },
                    icon: '🚨',
                  }
                );

                // Blink effect: toggle border every 1 second
                let blinkCount = 0;
                const blinkInterval = setInterval(() => {
                  blinkCount++;
                  const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`);
                  if (toastElement) {
                    const currentBorder = toastElement.style.borderColor;
                    toastElement.style.borderColor = currentBorder === 'rgb(239, 68, 68)' ? 'rgba(239, 68, 68, 0.3)' : '#ef4444';
                  }
                  if (blinkCount >= 15) {
                    clearInterval(blinkInterval);
                  }
                }, 1000);

                // Request notification permission and show browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`🚨 Price Alert: ${alert.asset_symbol}`, {
                    body: `${conditionText}\n${currentPriceText}`,
                    icon: '/favicon.ico',
                    tag: `alert-${alert.id}`, // Prevent duplicate notifications
                    requireInteraction: true,
                  });
                }
              }
            } catch (updateError) {
              console.error('Error updating alert:', updateError);
              processingAlerts.delete(alert.id); // Remove from processing if failed
            }
          }
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check immediately and then every 3 seconds
    checkAndTriggerAlerts();
    const interval = setInterval(checkAndTriggerAlerts, 3000);

    // Check when tab becomes visible (user switches back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndTriggerAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check when window gains focus
    const handleFocus = () => {
      checkAndTriggerAlerts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]); // Removed lastCheckedAlerts from dependencies

  return (
    <>
      <Head>
        <title>Synax - Crypto & Gold Trading Platform</title>
        <meta name="description" content="Synax - Professional cryptocurrency and gold trading platform with real-time prices, instant trading, and secure transactions. Trade 200+ cryptocurrencies and gold." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="keywords" content="cryptocurrency trading, gold trading, crypto exchange, bitcoin, ethereum, trading platform" />
        <meta name="author" content="Synax" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://synax.vip/" />
        <meta property="og:title" content="Synax - Crypto & Gold Trading Platform" />
        <meta property="og:description" content="Professional cryptocurrency and gold trading platform with real-time prices, instant trading, and secure transactions." />
        <meta property="og:image" content="https://synax.vip/images/logo.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://synax.vip/" />
        <meta name="twitter:title" content="Synax - Crypto & Gold Trading Platform" />
        <meta name="twitter:description" content="Professional cryptocurrency and gold trading platform with real-time prices, instant trading, and secure transactions." />
        <meta name="twitter:image" content="https://synax.vip/images/logo.png" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#0b0c1a" />
        <link rel="canonical" href="https://synax.vip/" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ChatWidget user={user} />
    </>
  );
}

export default MyApp;
