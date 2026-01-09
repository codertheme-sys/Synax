// pages/index.js - Home Page
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { FiTrendingUp, FiTrendingDown, FiStar, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Header from '../components/Header';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [goldPrice, setGoldPrice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const slides = [
    {
      title: 'Seize every opportunity in gold and crypto',
      subtitle: 'Real-time liquidity across metals and digital assets so you never miss a move.',
      image: '/images/slider-1.jpg',
    },
    {
      title: 'Trade faster with live market depth',
      subtitle: 'Built for speed with instant price discovery on 100+ cryptocurrencies and gold.',
      image: '/images/slider-2.jpg',
    },
    {
      title: 'Stay ahead with 24/7 insights',
      subtitle: 'Clean dashboards, live charts, and alerts keep you in control day and night.',
      image: '/images/slider-3.jpg',
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(false);

  useEffect(() => {
    checkUser();
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    
    // Check if mobile (only on client-side)
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', checkMobile);
      };
    }
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const textBox = document.getElementById('text-box');
    if (!textBox) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTextVisible(true);
          } else {
            // Reset animation when element leaves viewport
            setIsTextVisible(false);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(textBox);

    return () => {
      observer.unobserve(textBox);
    };
  }, []);

  // Global reveal animation for photos and text using classes
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-show');
          } else {
            entry.target.classList.remove('reveal-show');
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    const sliderTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(sliderTimer);
  }, [slides.length]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
    
    // Check admin status
    if (user) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setIsAdmin(profile.is_admin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }
    setCheckingAdmin(false);
  };

  const fetchPrices = async () => {
    setRefreshing(true);
    try {
      // Fetch prices from multiple sources (100+ coins + gold)
      const cryptoResponse = await fetch('/api/prices/crypto');
      const cryptoData = await cryptoResponse.json();
      
      console.log('Crypto API Response:', {
        success: cryptoData.success,
        dataLength: cryptoData.data?.length || 0,
        warning: cryptoData.warning,
        error: cryptoData.error
      });
      
      if (cryptoData.success && cryptoData.data && cryptoData.data.length > 0) {
        // Separate gold (id === 'gold' or symbol === 'GOLD')
        const gold = cryptoData.data.find(c => 
          c.id === 'gold' || 
          c.id === 'GOLD' || 
          c.symbol === 'GOLD' || 
          c.symbol === 'gold'
        );
        const cryptos = cryptoData.data.filter(c => 
          c.id !== 'gold' && 
          c.id !== 'GOLD' && 
          c.symbol !== 'GOLD' && 
          c.symbol !== 'gold'
        );
        
        console.log('Filtered data:', {
          total: cryptoData.data.length,
          gold: gold ? 'found' : 'not found',
          cryptos: cryptos.length
        });
        
        setCryptoPrices(cryptos || []);
        if (gold) {
          setGoldPrice(gold);
        } else {
          // Fetch gold separately
          try {
            const goldResponse = await fetch('/api/prices/gold');
            const goldData = await goldResponse.json();
            if (goldData.success && goldData.data) {
              setGoldPrice(goldData.data);
            }
          } catch (goldError) {
            console.error('Gold fetch error:', goldError);
          }
        }
      } else {
        // API returned empty or failed
        console.warn('Crypto API returned empty data:', cryptoData);
        setCryptoPrices([]);
        
        // Still try to fetch gold
        try {
          const goldResponse = await fetch('/api/prices/gold');
          const goldData = await goldResponse.json();
          if (goldData.success && goldData.data) {
            setGoldPrice(goldData.data);
          }
        } catch (goldError) {
          console.error('Gold fetch error:', goldError);
        }
        
        // Show warning if API failed
        if (cryptoData.warning) {
          toast.error(cryptoData.warning);
        } else if (cryptoData.error) {
          toast.error(cryptoData.error);
        }
      }
    } catch (error) {
      console.error('Fetch prices error:', error);
      toast.error('Error loading prices');
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '$0.00';
    if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      }).format(price);
    }
  };

  const formatPercent = (percent) => {
    if (percent === null || percent === undefined) return '0.00%';
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const displayData = [...cryptoPrices, ...(goldPrice ? [goldPrice] : [])];

  const filteredData = useMemo(() => {
    if (!search) return displayData;
    return displayData.filter((item) => {
      const name = item.name || item.id || '';
      const symbol = item.symbol || '';
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        symbol.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search, displayData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white flex flex-col items-center justify-center">
        <img src="/images/logo.png" alt="Synax" style={{ height: '100px', width: 'auto', marginBottom: '16px' }} />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
      {/* Use Header Component */}
      <Header />

      {/* Hero Section */}
      <main id="PAGES_CONTAINER" className="relative border-none" style={{ paddingTop: '40px' }}>
        <section
          id="comp-lt8qi2wq"
          className="relative overflow-hidden min-h-[70vh] md:min-h-[75vh] flex items-center justify-center px-4 pt-32 pb-20 border-none"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.4)), url(${slides[currentSlide].image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.4)), url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'opacity 0.8s ease-in-out',
                opacity: idx === currentSlide ? 1 : 0,
                zIndex: idx === currentSlide ? 2 : 1,
                pointerEvents: idx === currentSlide ? 'auto' : 'none',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/60" style={{ zIndex: 3 }} />
          
          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="relative z-10 max-w-5xl w-full text-center space-y-8 reveal-show" data-reveal>
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/15 text-sm text-white border border-white/30 backdrop-blur-sm reveal-show" data-reveal>
              <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="flex items-center gap-2 font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4.5L17 21l-5-3-5 3 1.5-7.5L2 9h7z"/></svg>
                Live pricing • Gold & Crypto
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white drop-shadow transition-all duration-500 reveal-show" data-reveal>
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto transition-all duration-500 reveal-show" data-reveal>
              {slides[currentSlide].subtitle}
            </p>
            <div className="flex items-center justify-center gap-2 pt-4">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 w-2.5 rounded-full transition ${idx === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Two-box section below slider - Side by side on desktop, stacked on mobile */}
      <section className="bg-[#0b0c1a] py-16 pt-32 border-none" style={{ marginTop: '80px' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-stretch" style={{ display: 'flex', flexDirection: window.innerWidth >= 1024 ? 'row' : 'column' }} data-reveal>
            {/* Photo Box - Top on mobile, Left on desktop */}
            <div className="flex-1 overflow-hidden bg-[#0f1124] min-h-[300px] lg:min-h-[500px] flex items-center justify-center border-none rounded-lg" data-reveal>
              <img
                src="/images/trader-monitor.jpg"
                alt="Trader at desk"
                className="w-full h-full object-cover"
                style={{ minHeight: '300px' }}
              />
            </div>
            {/* Text Box - Bottom on mobile, Right on desktop */}
            <div 
              id="text-box"
              className="flex-1 bg-gradient-to-br from-[#11142d] to-[#0b0c1a] flex items-center justify-center text-center min-h-[300px] lg:min-h-[500px] pt-8 pb-8 px-4 lg:px-8 border-none rounded-lg"
              data-reveal
            >
              <p 
                style={{
                  fontSize: isMobile ? '24px' : '60px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  lineHeight: '1.3',
                  textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 255, 255, 0.1)',
                  transition: 'opacity 1.5s ease-out, transform 1.5s ease-out',
                  opacity: isTextVisible ? 1 : 0.4,
                  transform: isTextVisible ? 'translateY(0)' : 'translateY(30px)',
                  display: 'block',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%'
                }}
              >
                Built for speed with instant price discovery on 200+ cryptocurrencies and gold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Separator image between boxes and FAQ */}
      <section className="bg-[#0b0c1a]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8" data-reveal>
          <img
            src="/images/tema-pic.jpg"
            alt="Section separator"
            className="w-full h-auto object-cover shadow-lg shadow-black/30"
          />
        </div>
      </section>

      {/* Additional separator with text */}
      <section className="bg-[#0b0c1a]">
        <div
          className="max-w-7xl mx-auto px-4 lg:px-6 space-y-10"
          style={{ paddingTop: '36px', paddingBottom: '36px' }}
          data-reveal
        >
          <div
            className="text-center font-extrabold text-gray-100 tracking-tight"
            style={{ fontSize: '44px', paddingBottom: '36px' }}
            data-reveal
          >
            Synax Pro-trading services
          </div>
          <img
            src="/images/tema-pc2.jpg"
            alt="Synax Pro-trading services"
            className="w-full h-auto object-cover shadow-lg shadow-black/30"
            data-reveal
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b0c1a] border-t border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/images/logo.png" alt="Synax" style={{ height: '32px', width: 'auto' }} />
            <span className="text-xl font-semibold text-blue-300 hover:text-blue-200 transition">Synax</span>
          </div>
          <p className="mb-0">© Copyright 2023-2025 Synax. All rights reserved.</p>
        </div>
      </footer>

      {/* Let's Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <button className="bg-white text-[#0b0c1a] px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold hover:scale-105 transition-transform">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            S
          </div>
          Let's Chat!
        </button>
      </div>
    </div>
  );
}




