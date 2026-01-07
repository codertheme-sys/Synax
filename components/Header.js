import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  // Removed debug logs
  
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileSupportOpen, setMobileSupportOpen] = useState(false);
  
  // Removed debug logs

  useEffect(() => {
    // Removed debug logs
    
    // Only run on client side
    if (typeof window === 'undefined') {
      // Removed debug logs
      return;
    }
    
    // Removed debug logs
    setMounted(true);
    
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      // Removed debug logs
      setIsMobile(mobile);
      // Removed debug logs
    };
    
    // Check immediately
    // Removed debug logs
    checkMobile();
    // Removed debug logs
    
    // Listen for resize
    window.addEventListener('resize', checkMobile);
    // Removed debug logs
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      // Removed debug logs
    };
  }, []);

  useEffect(() => {
    const checkUserAndAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        // Removed debug logs
        
        setUser(session?.user || null);
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
          
          // Removed debug logs
          
          if (error) {
            console.error('Error fetching profile:', error);
            setIsAdmin(false);
          } else {
            const adminStatus = profile?.is_admin === true;
            // Removed debug logs
            setIsAdmin(adminStatus);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setCheckingAdmin(false);
        setCheckingUser(false);
      }
    };

    checkUserAndAdmin();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserAndAdmin();
    });

    // Also check on route change
    router.events?.on('routeChangeComplete', checkUserAndAdmin);

    return () => {
      subscription?.unsubscribe();
      router.events?.off('routeChangeComplete', checkUserAndAdmin);
    };
  }, [router.pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCheckingUser(true);
      // Force page refresh to clear all state
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const pageNames = {
    '/home': 'Home',
    '/dashboard': 'Home', // Legacy support
    '/trade': 'Trade',
    '/earn': 'Earn',
    '/mining': 'Mining',
    '/portfolio': 'Portfolio',
    '/assets': 'Assets',
    '/login': 'Login',
    '/signup': 'Sign Up',
    '/deposit': 'Deposit',
    '/withdraw': 'Withdraw',
    '/admin': 'Admin Panel',
    '/terms': 'Terms of Use',
    '/privacy': 'Privacy Policy',
    '/contact': 'Contact',
    '/faq': 'FAQ',
  };
  const pageName = pageNames[router.pathname] || '';

  const navLinkStyle = (path) => {
    const isActive = router.pathname === path;
    const isAdminLink = path === '/admin';
    
    return {
      marginLeft: '24px',
      marginRight: '24px',
      fontSize: '18px',
      color: isAdminLink ? '#60a5fa' : (isActive ? '#ffffff' : '#d1d5db'),
      textDecoration: 'none',
      fontWeight: 600,
      borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
      paddingBottom: '6px',
      transition: 'color 0.2s ease, border-color 0.2s ease',
    };
  };

  // Removed debug logs

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-[#0b0c1a]/85 via-[#11142d]/85 to-[#0b0c1a]/85 shadow-lg shadow-black/30"
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-6">
          <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition">
            <img src="/images/logo.png" alt="Synax" style={{ height: '72px', width: 'auto' }} />
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>
              {pageName || 'SYNAX'}
            </span>
          </Link>

          {/* Desktop Navigation - Show by default, hide only when mobile is confirmed */}
          {(() => {
            const lgBreakpoint = 1024;
            const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
            const shouldShowDesktop = currentWidth >= lgBreakpoint;
            // Removed debug logs
            return null;
          })()}
          <div style={{
            display: (!mounted || !isMobile) ? 'flex' : 'none', 
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1
          }}>
              <Link href="/home" style={navLinkStyle('/home')}>Home</Link>
              <Link href="/trade" style={navLinkStyle('/trade')}>Trade</Link>
              <Link href="/earn" style={navLinkStyle('/earn')}>Earn</Link>
              <Link href="/mining" style={navLinkStyle('/mining')}>Mining</Link>
              <Link href="/assets" style={{...navLinkStyle('/assets'), borderBottom: 'none'}}>Assets</Link>
              {!checkingAdmin && isAdmin && (
                <Link href="/admin" style={navLinkStyle('/admin')}>Admin Panel</Link>
              )}
              {checkingAdmin && (
                <span style={{ marginLeft: '24px', marginRight: '24px', fontSize: '18px', color: '#9ca3af' }}>Loading...</span>
              )}
              <div
                className="relative"
                onMouseEnter={() => setSupportOpen(true)}
                onMouseLeave={() => setSupportOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '-4px',
                }}
              >
                <button
                  type="button"
                  className="underline underline-offset-4"
                  style={{
                    marginLeft: '24px',
                    marginRight: '24px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#d1d5db',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    paddingBottom: '6px',
                    cursor: 'pointer',
                    lineHeight: '1',
                  }}
                >
                  Support
                </button>
                <div
                  className="absolute left-0 rounded-xl bg-[#0f1124]/95 backdrop-blur-lg shadow-2xl"
                  style={{
                    width: '220px',
                    top: '100%',
                    marginTop: '4px',
                    display: supportOpen ? 'block' : 'none',
                    border: 'none',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                  }}
                >
                  <Link href="/faq" className="block text-blue-300 hover:text-blue-200 hover:bg-white/10" style={{ fontSize: '18px', padding: '14px 16px' }}>FAQ</Link>
                  <Link href="/terms" className="block text-blue-300 hover:text-blue-200 hover:bg-white/10" style={{ fontSize: '18px', padding: '14px 16px' }}>Terms of Use</Link>
                  <Link href="/privacy" className="block text-blue-300 hover:text-blue-200 hover:bg-white/10" style={{ fontSize: '18px', padding: '14px 16px' }}>Privacy Policy</Link>
                  <Link href="/contact" className="block text-blue-300 hover:text-blue-200 hover:bg-white/10" style={{ fontSize: '18px', padding: '14px 16px' }}>Contact</Link>
                </div>
              </div>
            </div>

          {/* Mobile Menu Button - Show only on mobile after mount */}
          {(() => {
            // Removed debug logs
            return null;
          })()}
          {mounted && isMobile && (
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
              }}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
            </button>
          )}

          {/* Login/Signup or Sign Out Button - Desktop */}
          {(() => {
            // Removed debug logs
            return null;
          })()}
          {!checkingUser && !user && (!mounted || !isMobile) && (
            <>
              <Link 
                href="/login" 
                style={{
                  marginLeft: '24px',
                  marginRight: '24px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderBottom: router.pathname === '/login' ? '2px solid #3b82f6' : '2px solid transparent',
                  paddingBottom: router.pathname === '/login' ? '6px' : '8px',
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
              >
                Log in
              </Link>
              <Link 
                href="/signup" 
                style={{
                  marginLeft: '24px',
                  marginRight: '24px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#4ade80',
                  textDecoration: 'none',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderBottom: router.pathname === '/signup' ? '2px solid #22c55e' : '2px solid transparent',
                  paddingBottom: router.pathname === '/signup' ? '6px' : '8px',
                  transition: 'color 0.2s ease, border-color 0.2s ease',
                }}
              >
                Sign up
              </Link>
            </>
          )}
          {!checkingUser && user && (!mounted || !isMobile) && (
            <button
              onClick={handleSignOut}
              style={{
                marginLeft: '24px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {(() => {
          // Removed debug logs
          return null;
        })()}
        {isMobile && mobileMenuOpen && (
          <div className="border-t border-white/10 mt-4 pt-4 pb-4">
            <div className="flex flex-col gap-3">
              <Link href="/home" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/home' ? '#ffffff' : '#d1d5db', fontWeight: 600, borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Home</Link>
              <Link href="/trade" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/trade' ? '#ffffff' : '#d1d5db', fontWeight: 600, borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Trade</Link>
              <Link href="/earn" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/earn' ? '#ffffff' : '#d1d5db', fontWeight: 600, borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Earn</Link>
              <Link href="/mining" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/mining' ? '#ffffff' : '#d1d5db', fontWeight: 600, borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Mining</Link>
              <Link href="/assets" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/assets' ? '#ffffff' : '#d1d5db', fontWeight: 600, textDecoration: 'none', borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Assets</Link>
              {!checkingAdmin && isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 16px', fontSize: '16px', color: router.pathname === '/admin' ? '#ffffff' : '#d1d5db', fontWeight: 600, borderBottom: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>Admin Panel</Link>
              )}
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => setMobileSupportOpen(!mobileSupportOpen)}
                  style={{
                    padding: '12px 16px',
                    fontSize: '16px',
                    color: '#d1d5db',
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                  }}
                >
                  <span>Support</span>
                  <span style={{ transform: mobileSupportOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#d1d5db' }}>▼</span>
                </button>
                {mobileSupportOpen && (
                  <div style={{ paddingLeft: '16px' }}>
                    <Link href="/faq" onClick={() => { setMobileMenuOpen(false); setMobileSupportOpen(false); }} style={{ padding: '12px 16px', fontSize: '16px', color: '#9ca3af', display: 'block' }}>FAQ</Link>
                    <Link href="/terms" onClick={() => { setMobileMenuOpen(false); setMobileSupportOpen(false); }} style={{ padding: '12px 16px', fontSize: '16px', color: '#9ca3af', display: 'block' }}>Terms</Link>
                    <Link href="/privacy" onClick={() => { setMobileMenuOpen(false); setMobileSupportOpen(false); }} style={{ padding: '12px 16px', fontSize: '16px', color: '#9ca3af', display: 'block' }}>Privacy</Link>
                    <Link href="/contact" onClick={() => { setMobileMenuOpen(false); setMobileSupportOpen(false); }} style={{ padding: '12px 16px', fontSize: '16px', color: '#9ca3af', display: 'block' }}>Contact</Link>
                  </div>
                )}
              </div>
              {!checkingUser && !user && (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setMobileMenuOpen(false)} 
                    style={{ 
                      padding: '12px 16px', 
                      fontSize: '16px', 
                      color: '#60a5fa', 
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setMobileMenuOpen(false)} 
                    style={{ 
                      padding: '12px 16px', 
                      fontSize: '16px', 
                      color: '#4ade80', 
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Sign up
                  </Link>
                </>
              )}
              {!checkingUser && user && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}