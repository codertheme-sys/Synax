import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';

function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center mb-12">
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Terms of Use
          </h1>
          <p style={{ fontSize: '16px', color: '#d1d5db' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ background: 'rgba(15, 17, 36, 0.95)', borderRadius: '16px', padding: '48px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="space-y-6" style={{ color: '#e5e7eb', lineHeight: '1.8' }}>
            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Synax platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Use, please do not use our service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>2. Description of Service</h2>
              <p>
                Synax is a cryptocurrency and gold trading platform that provides users with the ability to trade, deposit, withdraw, and manage digital assets. Our services include but are not limited to trading, staking, and portfolio management.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>4. Trading and Transactions</h2>
              <p>
                All trades and transactions are final. You acknowledge that cryptocurrency and gold prices are volatile and that you may lose money. We are not responsible for any losses incurred through trading activities.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>5. Prohibited Activities</h2>
              <p>
                You agree not to use the platform for any illegal activities, money laundering, fraud, or any activity that violates applicable laws and regulations. Violation of this section may result in immediate account termination and legal action.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>6. Limitation of Liability</h2>
              <p>
                Synax shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability shall not exceed the amount you paid to us in the past 12 months.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>7. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>8. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Use, please contact us through our support channels or visit the Contact page.
              </p>
            </section>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/"
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TermsPage;














