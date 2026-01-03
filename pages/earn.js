import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 1)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

// Get coin image URL from CoinGecko
const getCoinImageUrl = (asset) => {
  const coinGeckoIds = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'AVAX': 'avalanche-2',
    'LTC': 'litecoin',
    'TRX': 'tron',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'USDT': 'tether',
    'XAU': 'gold'
  };
  
  const coinId = coinGeckoIds[asset] || asset.toLowerCase();
  return `https://assets.coingecko.com/coins/images/${getCoinImageId(asset)}/large/${coinId}.png`;
};

const getCoinImageId = (asset) => {
  // CoinGecko image IDs
  const imageIds = {
    'BTC': '1',
    'ETH': '279',
    'BNB': '825',
    'SOL': '4128',
    'XRP': '52',
    'ADA': '975',
    'DOGE': '5',
    'DOT': '12171',
    'AVAX': '12559',
    'LTC': '2',
    'TRX': '1958',
    'LINK': '877',
    'MATIC': '4713',
    'UNI': '1256',
    'ATOM': '3794',
    'USDT': '825',
    'XAU': '0'
  };
  return imageIds[asset] || '1';
};

function EarnPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [amount, setAmount] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [balance, setBalance] = useState(0);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setBalance(parseFloat(profile.balance || 0));
          }
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/earn/products');
        const result = await response.json();
        
        console.log('Earn products API response:', result);
        console.log('Response success:', result.success);
        console.log('Response data:', result.data);
        console.log('Data length:', result.data?.length);
        
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          console.log('Setting products:', result.data);
          console.log('Products array is valid:', Array.isArray(result.data));
          console.log('Products length:', result.data.length);
          setProducts(result.data);
          console.log('Products state set, current products:', result.data);
        } else {
          // Fallback to default products
          console.log('Using fallback products - API returned:', { success: result.success, dataLength: result.data?.length });
          const fallbackProducts = [
            { id: 1, asset: 'BTC', name: 'Bitcoin', type: 'Flexible', apr: '3.5%', minDeposit: '0.001', duration: 'N/A', days: null },
            { id: 2, asset: 'ETH', name: 'Ethereum', type: 'Locked', apr: '5.2%', minDeposit: '0.01', duration: '30 days', days: 30 },
            { id: 3, asset: 'SOL', name: 'Solana', type: 'Locked', apr: '6.8%', minDeposit: '1', duration: '60 days', days: 60 },
            { id: 4, asset: 'USDT', name: 'Tether', type: 'Flexible', apr: '4.1%', minDeposit: '10', duration: 'N/A', days: null },
            { id: 5, asset: 'XAU', name: 'Gold', type: 'Locked', apr: '2.5%', minDeposit: '0.1 oz', duration: '90 days', days: 90 },
          ];
          setProducts(fallbackProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products. Using default values.');
        // Fallback to default products
        const fallbackProducts = [
          { id: 1, asset: 'BTC', name: 'Bitcoin', type: 'Flexible', apr: '3.5%', minDeposit: '0.001', duration: 'N/A', days: null },
          { id: 2, asset: 'ETH', name: 'Ethereum', type: 'Locked', apr: '5.2%', minDeposit: '0.01', duration: '30 days', days: 30 },
          { id: 3, asset: 'SOL', name: 'Solana', type: 'Locked', apr: '6.8%', minDeposit: '1', duration: '60 days', days: 60 },
          { id: 4, asset: 'USDT', name: 'Tether', type: 'Flexible', apr: '4.1%', minDeposit: '10', duration: 'N/A', days: null },
          { id: 5, asset: 'XAU', name: 'Gold', type: 'Locked', apr: '2.5%', minDeposit: '0.1 oz', duration: '90 days', days: 90 },
        ];
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Scroll reveal animation for products after they load
  useEffect(() => {
    if (!loading && products.length > 0 && isClient) {
      // Wait for DOM to update
      const timer = setTimeout(() => {
        const elements = Array.from(document.querySelectorAll('[data-reveal]'));
        
        const isInViewport = (el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        };

        // Create IntersectionObserver for scroll reveal
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

        // Observe all elements
        elements.forEach((el) => {
          // If already in viewport, reveal immediately
          if (isInViewport(el)) {
            el.classList.add('reveal-show');
          } else {
            // Otherwise observe for scroll
            observer.observe(el);
          }
        });

        return () => {
          elements.forEach((el) => observer.unobserve(el));
        };
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, products, isClient]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main
        className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16"
        style={{ paddingLeft: isMobile ? '16px' : '200px', paddingRight: isMobile ? '16px' : '200px', display: 'flex', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div className="text-center mb-8 sm:mb-12 reveal-show animate-fade-in" data-reveal>
            <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 900, color: '#ffffff', lineHeight: '1.1', marginBottom: '20px', letterSpacing: '-0.02em' }}>
              Simple Earn
            </h1>
            <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: '#ffffff', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)', padding: isMobile ? '0 16px' : '0' }}>
              Easily make a profit by depositing digital assets to different locked-in periods.
            </p>
          </div>

        {/* Information Banner */}
        {showInfo && (
          <div
            style={{
              ...cardStyle,
              padding: '24px',
              marginBottom: '32px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              animation: 'fadeInDown 0.6s ease-out',
            }}
            className="reveal-show"
            data-reveal
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                  Simple Earn
                </h3>
                <p style={{ fontSize: '15px', color: '#d1d5db', lineHeight: '1.7', marginBottom: '12px' }}>
                  Easily make a profit by depositing digital assets to different locked-in periods. It is a principal protected product. Your deposits are protected in token amount (value of the assets are subject to market fluctuation). You can reap profits on multiple types of digital assets, thereby transforming your investment portfolio's potential.
                </p>
                <p style={{ fontSize: '15px', color: '#d1d5db', lineHeight: '1.7' }}>
                  Subscribe at any time to start making daily profits. Locked-in Products have fixed duration offering higher APRs. Deposits in Simple Earn Products may be loaned to other investors used for staking on Proof-of-Stake (PoS) networks to generate yields.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Available Products Section */}
        <div style={{ marginBottom: '48px' }} className="reveal-show" data-reveal>
          <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
            Available Products
          </h2>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#9ca3af', marginBottom: '24px' }}>
            Earn rewards on principal-protected products.
          </p>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              Loading products...
            </div>
          ) : !products || !Array.isArray(products) || products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              No products available at the moment.
            </div>
          ) : (
          <div
            className="animate-fade-in"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '30px',
              opacity: 1,
              transform: 'translateY(0)'
            }}
          >
            {products.map((product, index) => {
              console.log(`Rendering product ${index}:`, product);
              if (!product || !product.id) {
                console.warn(`Invalid product at index ${index}:`, product);
                return null;
              }
              return (
              <div
                key={product.id}
                style={{
                  ...cardStyle,
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  width: '100%',
                  margin: '0 auto',
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: '80px',
                }}
                className="animate-fade-in"
                onClick={() => setSelectedProduct(product)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 30px 45px -5px rgba(0, 0, 0, 0.55)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)';
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'auto 1fr auto auto' : 'auto 1.6fr 1fr 1fr 1fr auto',
                    gridTemplateRows: isMobile ? 'auto auto' : 'auto',
                    alignItems: 'center',
                    gap: isMobile ? '12px' : '24px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 2,
                    opacity: 1,
                    visibility: 'visible',
                    height: '100%',
                    paddingTop: '0',
                    paddingBottom: isMobile ? '16px' : '50px',
                    marginTop: '0',
                    marginBottom: '0',
                  }}
                  data-reveal
                >
                  {/* Coin Icon */}
                  <div
                    style={{
                      width: '51px',
                      height: '51px',
                      borderRadius: '50%',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      position: 'relative',
                      gridRow: isMobile ? '1 / 3' : '1',
                    }}
                  >
                    <img
                      src={getCoinImageUrl(product.asset)}
                      alt={product.asset}
                      onError={(e) => {
                        // Fallback to coin name if image fails to load
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) {
                          fallback.style.display = 'block';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '4px',
                      }}
                    />
                    <span style={{ display: 'none', fontSize: '14px', fontWeight: 700, color: '#ffffff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      {product.asset}
                    </span>
                  </div>

                  {/* Asset + Type Column (Mobile: Row 1, Col 2) */}
                  <div style={{ 
                    opacity: 1, 
                    visibility: 'visible', 
                    gridColumn: isMobile ? '2' : '2',
                    gridRow: isMobile ? '1' : '1',
                  }}>
                    <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#ffffff', marginBottom: '2px', opacity: 1, visibility: 'visible' }}>
                      {product.asset} {product.type}
                    </div>
                  </div>

                  {/* APR Column (Mobile: Row 1, Col 3) */}
                  <div style={{ 
                    textAlign: isMobile ? 'left' : 'center', 
                    opacity: 1, 
                    visibility: 'visible',
                    gridColumn: isMobile ? '3' : '3',
                    gridRow: isMobile ? '1' : '1',
                  }}>
                    <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#9ca3af', marginBottom: '4px', opacity: 1, visibility: 'visible' }}>APR</div>
                    <div style={{ fontSize: isMobile ? '16px' : '26px', fontWeight: 800, color: '#4ade80', opacity: 1, visibility: 'visible' }}>{product.apr}</div>
                  </div>

                  {/* Min Deposit Column (Mobile: Row 2, Col 2) */}
                  {isMobile && (
                    <div style={{ 
                      gridColumn: '2',
                      gridRow: '2',
                      opacity: 1, 
                      visibility: 'visible',
                    }}>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Min</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>${product.minDeposit}</div>
                    </div>
                  )}

                  {/* Subscribe Button (Mobile: Row 2, Col 3-4) */}
                  <button
                    style={{
                      padding: isMobile ? '8px 16px' : '10px 20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      justifySelf: isMobile ? 'end' : 'end',
                      gridColumn: isMobile ? '3 / 5' : '6',
                      gridRow: isMobile ? '2' : '1',
                      marginRight: isMobile ? '0' : '65px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                  >
                    Subscribe
                  </button>

                  {/* Desktop Columns */}
                  {!isMobile && (
                    <>
                      <div style={{ textAlign: 'center', paddingRight: '45px', opacity: 1, visibility: 'visible' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', opacity: 1, visibility: 'visible' }}>Days (Locked in)</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', opacity: 1, visibility: 'visible' }}>
                          {product.type === 'Flexible'
                            ? 'Flexible'
                            : (product.days || product.duration?.replace(' days', '').replace(' day', '') || 'N/A')}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center', paddingRight: '55px', opacity: 1, visibility: 'visible' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', opacity: 1, visibility: 'visible' }}>Minimum ($)</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', opacity: 1, visibility: 'visible' }}>{product.minDeposit}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          )}
        </div>

        </div>

        {/* Subscribe Modal */}
        {selectedProduct && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              style={{
                ...cardStyle,
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                  Subscribe to {selectedProduct.name} {selectedProduct.type}
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af' }}>APR</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>{selectedProduct.apr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#9ca3af' }}>Min Deposit</span>
                  <span style={{ color: '#ffffff' }}>${selectedProduct.minDeposit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Duration</span>
                  <span style={{ color: '#ffffff' }}>{selectedProduct.duration}</span>
                </div>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  
                  // Check balance
                  const amountValue = parseFloat(amount);
                  if (amountValue > balance) {
                    toast.error('Insufficient balance. Please deposit funds first.');
                    return;
                  }
                  
                  try {
                    // Get auth token
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      toast.error('Please log in to subscribe');
                      return;
                    }

                    // Call subscription API
                    const response = await fetch('/api/earn/subscribe', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({
                        productId: selectedProduct.id,
                        amount: amountValue
                      })
                    });

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                      const errorMsg = result.details 
                        ? `${result.error}: ${result.details}` 
                        : (result.error || 'Failed to subscribe');
                      console.error('Subscribe error:', result);
                      throw new Error(errorMsg);
                    }

                    // Update balance
                    if (result.newBalance !== undefined) {
                      setBalance(result.newBalance);
                    }

                    toast.success(`Successfully subscribed to ${selectedProduct.name}!`);
                    setSelectedProduct(null);
                    setAmount('');
                    
                    // Refresh balance
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('balance')
                      .eq('id', session.user.id)
                      .single();
                    
                    if (profile) {
                      setBalance(parseFloat(profile.balance || 0));
                    }
                  } catch (error) {
                    console.error('Subscribe error:', error);
                    toast.error(error.message || 'Failed to subscribe. Please try again.');
                  }
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min={500}
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                    placeholder="Min: $500"
                  />
                </div>
                {amount && parseFloat(amount) >= 500 && (
                  <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>Estimated Daily Earnings</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#4ade80' }}>
                      ${(parseFloat(amount) * parseFloat(selectedProduct.apr.replace('%', '')) / 100 / 365).toFixed(2)} USD
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!amount || parseFloat(amount) < parseFloat(selectedProduct.minDeposit)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: !amount || parseFloat(amount) < parseFloat(selectedProduct.minDeposit) ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: !amount || parseFloat(amount) < parseFloat(selectedProduct.minDeposit) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default EarnPage;


