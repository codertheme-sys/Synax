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

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [lastCheckedAlerts, setLastCheckedAlerts] = useState(new Set());
  const [liveChatLoaded, setLiveChatLoaded] = useState(false);

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

  // Load LiveChat Script
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Check if LiveChat is already loaded
    if (window.LiveChatWidget || window.__lc?.license) return;
    
    // LiveChat script configuration
    window.__lc = window.__lc || {};
    window.__lc.license = 19453766;
    window.__lc.integration_name = "manual_channels";
    window.__lc.product_name = "livechat";
    
    // LiveChat widget initialization
    (function(n, t, c) {
      function i(n) {
        return e._h ? e._h.apply(null, n) : e._q.push(n);
      }
      var e = {
        _q: [],
        _h: null,
        _v: "2.0",
        on: function() {
          i(["on", c.call(arguments)]);
        },
        once: function() {
          i(["once", c.call(arguments)]);
        },
        off: function() {
          i(["off", c.call(arguments)]);
        },
        get: function() {
          if (!e._h) throw new Error("[LiveChatWidget] You can't use getters before load.");
          return i(["get", c.call(arguments)]);
        },
        call: function() {
          i(["call", c.call(arguments)]);
        },
        init: function() {
          var n = t.createElement("script");
          n.async = !0;
          n.type = "text/javascript";
          n.src = "https://cdn.livechatinc.com/tracking.js";
          t.head.appendChild(n);
        }
      };
      !n.__lc.asyncInit && e.init();
      n.LiveChatWidget = n.LiveChatWidget || e;
    })(window, document, [].slice);
    
    setLiveChatLoaded(true);
  }, []);

  // Check for user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      {/* Floating Live Chat Icon */}
      <button
        onClick={() => {
          // Try different live chat services
          if (typeof window !== 'undefined') {
            // Tawk.to
            if (window.Tawk_API) {
              window.Tawk_API.maximize();
            }
            // Crisp
            else if (window.$crisp) {
              window.$crisp.push(["do", "chat:open"]);
            }
            // Intercom
            else if (window.Intercom) {
              window.Intercom('show');
            }
            // LiveChat
            else if (window.LiveChatWidget) {
              window.LiveChatWidget.call('maximize');
            }
            else if (window.LC_API) {
              window.LC_API.open_chat_window();
            }
            // Zendesk Chat
            else if (window.zE) {
              window.zE('messenger', 'open');
            }
            // Generic fallback - try to find and click live chat widget
            else {
              const chatWidget = document.querySelector('[id*="chat"], [class*="chat"], [id*="livechat"], [class*="livechat"]');
              if (chatWidget) {
                chatWidget.click();
              } else {
                console.log('Live chat widget not found. Please ensure your live chat script is loaded.');
              }
            }
          }
        }}
        aria-label="Live Chat"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '22px',
          fontWeight: 800,
          border: '1px solid rgba(255,255,255,0.25)',
          cursor: 'pointer',
          zIndex: 9999,
        }}
        title="Live Chat"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.transition = 'transform 0.2s ease';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
          <line x1="9" y1="14" x2="13" y2="14" />
        </svg>
      </button>
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
    </>
  );
}

export default MyApp;
