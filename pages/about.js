// pages/about.js - About Us Page
import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - Synax | Professional Trading Platform</title>
        <meta name="description" content="Learn about Synax, a professional trading platform for cryptocurrencies and gold. Our mission, values, and commitment to secure trading." />
        <meta name="keywords" content="Synax, trading platform, cryptocurrency, gold trading, about us" />
        <meta name="author" content="Synax" />
        <meta property="og:title" content="About Us - Synax" />
        <meta property="og:description" content="Learn about Synax, a professional trading platform for cryptocurrencies and gold." />
        <meta property="og:type" content="website" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
        <Header />
        <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              About Synax
            </h1>
            
            <div style={{ 
              background: 'rgba(15, 17, 36, 0.95)', 
              borderRadius: '16px', 
              padding: '40px', 
              marginBottom: '32px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>Our Mission</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb', marginBottom: '24px' }}>
                Synax is a professional trading platform designed to provide secure, fast, and reliable access to cryptocurrency and gold trading. We are committed to offering our users the best trading experience with real-time market data, instant execution, and comprehensive risk management tools.
              </p>

              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px', marginTop: '32px' }}>Our Values</h2>
              <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb', paddingLeft: '24px' }}>
                <li style={{ marginBottom: '12px' }}><strong>Security:</strong> Your funds and data security are our top priority. We use industry-standard encryption and security measures.</li>
                <li style={{ marginBottom: '12px' }}><strong>Transparency:</strong> We believe in clear communication and transparent trading practices.</li>
                <li style={{ marginBottom: '12px' }}><strong>Innovation:</strong> We continuously improve our platform with the latest technology and features.</li>
                <li style={{ marginBottom: '12px' }}><strong>Customer Support:</strong> We provide responsive and helpful customer support to assist you at every step.</li>
              </ul>

              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px', marginTop: '32px' }}>Why Choose Synax?</h2>
              <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb', paddingLeft: '24px' }}>
                <li style={{ marginBottom: '12px' }}>Real-time market data and instant execution</li>
                <li style={{ marginBottom: '12px' }}>Support for 200+ cryptocurrencies and gold</li>
                <li style={{ marginBottom: '12px' }}>Advanced trading tools and risk management</li>
                <li style={{ marginBottom: '12px' }}>Secure platform with SSL encryption</li>
                <li style={{ marginBottom: '12px' }}>24/7 customer support</li>
                <li style={{ marginBottom: '12px' }}>User-friendly interface for both beginners and experienced traders</li>
              </ul>

              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px', marginTop: '32px' }}>Contact Information</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb', marginBottom: '12px' }}>
                For any inquiries, please contact us through our support chat or email.
              </p>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb' }}>
                We are committed to providing excellent service and ensuring your trading experience is secure and enjoyable.
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link href="/" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '8px',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
              }}>
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
