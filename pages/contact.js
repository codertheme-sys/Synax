// pages/contact.js - Contact Us Page
import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import Link from 'next/link';

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact Us - Synax | Get in Touch</title>
        <meta name="description" content="Contact Synax support team. We're here to help with any questions about our trading platform." />
        <meta name="keywords" content="Synax, contact, support, help, trading platform" />
        <meta name="author" content="Synax" />
        <meta property="og:title" content="Contact Us - Synax" />
        <meta property="og:description" content="Contact Synax support team for assistance." />
        <meta property="og:type" content="website" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
        <Header />
        <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
          <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
              Contact Us
            </h1>
            
            <div style={{ 
              background: 'rgba(15, 17, 36, 0.95)', 
              borderRadius: '16px', 
              padding: '40px', 
              marginBottom: '32px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>Get in Touch</h2>
              <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb', marginBottom: '32px' }}>
                We're here to help! If you have any questions, concerns, or need assistance with our platform, please don't hesitate to reach out to us.
              </p>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Support Chat</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb' }}>
                  Use the chat widget in the bottom right corner of any page for instant support. Our team is available 24/7 to assist you.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Response Time</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb' }}>
                  We aim to respond to all inquiries within 24 hours. For urgent matters, please use the support chat for immediate assistance.
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Business Hours</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb' }}>
                  Our support team is available 24/7 to assist you with any questions or concerns.
                </p>
              </div>

              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: '12px', 
                padding: '24px', 
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginTop: '32px'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Security & Privacy</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#e5e7eb' }}>
                  Your privacy and security are important to us. All communications are encrypted and handled with the utmost care. For more information, please review our <Link href="/privacy" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Privacy Policy</Link> and <Link href="/terms" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Terms of Service</Link>.
                </p>
              </div>
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
