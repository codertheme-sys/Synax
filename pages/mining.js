import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';

function MiningPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
    
    // Listen for Profile Settings modal open event from Header
    const handleOpenProfileModal = () => {
      router.push('/home?openProfile=true');
    };
    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    return () => window.removeEventListener('openProfileModal', handleOpenProfileModal);
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0c1a 0%, #11142d 50%, #0b0c1a 100%)',
    }}>
      <Header />
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '24px',
        paddingTop: '120px',
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}>
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 120px)',
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: '#ffffff',
            textShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
            marginBottom: '24px',
            textTransform: 'uppercase',
          }}>
            COMING SOON
          </h1>
        </div>
      </main>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

export default MiningPage;



