import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white pb-16">
      <Header />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 pt-16">
        <div className="text-center mb-12">
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '16px', color: '#d1d5db' }}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ background: 'rgba(15, 17, 36, 0.95)', borderRadius: '16px', padding: '48px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="space-y-6" style={{ color: '#e5e7eb', lineHeight: '1.8' }}>
            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including name, email address, phone number, and KYC documents. We also automatically collect certain information about your device and usage of our services.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, process transactions, verify your identity, send you notifications, and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>3. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share your information with service providers who assist us in operating our platform, with law enforcement when required by law, or in connection with a business transfer.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>5. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us through our support channels.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>7. Children's Privacy</h2>
              <p>
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>8. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>9. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through our support channels or visit the Contact page.
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

export default PrivacyPage;














