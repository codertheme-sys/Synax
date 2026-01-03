import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';

const faqs = [
  { 
    q: 'How do I create a Synax account?', 
    a: 'Tap Sign Up, verify your email, set a strong password, and complete KYC. Once verified, deposits and trading are enabled within minutes. You can start trading cryptocurrencies and gold pairs immediately after account verification.' 
  },
  { 
    q: 'Do I need KYC to trade?', 
    a: 'Yes. KYC is required for deposits, withdrawals, and real-money trading. It protects your account and helps us comply with regulations. The verification process typically takes a few minutes to complete.' 
  },
  { 
    q: 'Which assets can I trade?', 
    a: 'You can access major cryptos, selected altcoins, and live gold pairs. Availability may vary by region and account status. We support over 200+ cryptocurrencies including BTC, ETH, SOL, USDT, and many more.' 
  },
  { 
    q: 'How fast are deposits?', 
    a: 'Most crypto deposits settle after network confirmations. Speed depends on network load; high-priority networks are often fastest. Typically, deposits are credited within 10-30 minutes depending on the blockchain network.' 
  },
  { 
    q: 'When will withdrawals arrive?', 
    a: 'Withdrawals pass security checks (2FA/KYC) and then broadcast to the network. Timing depends on congestion and the chain you choose. Most withdrawals are processed within 24 hours after security verification.' 
  },
  { 
    q: 'Is there a minimum deposit?', 
    a: 'Yes, it varies by asset. Check the asset info before sending funds to avoid dust or rejected transfers. Minimum deposits typically range from $10 to $50 depending on the cryptocurrency or gold pair.' 
  },
  { 
    q: 'What fees does Synax charge?', 
    a: 'Trading fees appear on each pair; blockchain transfers include network fees. No hidden platform fees are added to network costs. Our fee structure is transparent and competitive, with lower fees for higher trading volumes.' 
  },
  { 
    q: 'Can I use Earn products?', 
    a: 'Yes. Pick an Earn offer, lock your asset, and track rewards in Dashboard. Flexible Earn can be redeemed anytime; locked follows its term. Earn products offer competitive APRs ranging from 5% to 15% depending on the asset and lock period.' 
  },
  { 
    q: 'How are Earn yields calculated?', 
    a: 'Yields are shown as APR/APY per product. Rewards accrue based on your locked amount, duration, and the product\'s rate schedule. Yields are calculated daily and compounded automatically for maximum returns.' 
  },
  { 
    q: 'Can I redeem Earn early?', 
    a: 'Flexible Earn is redeemable anytime. Locked products must complete the stated term before redemption is available. Early redemption of locked products may incur a small penalty fee.' 
  },
  { 
    q: 'Does Synax support staking?', 
    a: 'Some Earn products are staking-backed on supported networks. Rates and availability depend on protocol rewards and network conditions. We support staking for major Proof-of-Stake cryptocurrencies.' 
  },
  { 
    q: 'Is two-factor authentication available?', 
    a: 'Yes. Enable 2FA in Profile to protect logins, withdrawals, and sensitive changes. We strongly recommend keeping 2FA on. You can use authenticator apps like Google Authenticator or Authy for enhanced security.' 
  },
  { 
    q: 'How do I reset my password?', 
    a: 'Click Forgot Password on login, follow the email link, and set a new password. Re-enable 2FA afterward for security. Password reset links expire after 1 hour for your protection.' 
  },
  { 
    q: 'Can I see my PnL on the dashboard?', 
    a: 'Yes. Dashboard shows balances, PnL, positions, and recent orders in real time. Export history for detailed reports. You can view your profit and loss for different time periods including daily, weekly, monthly, and all-time.' 
  },
  { 
    q: 'Do you have a mobile experience?', 
    a: 'Synax is fully responsive on mobile browsers. Native mobile apps are planned; watch announcements for release dates. Our mobile web interface provides full functionality for trading, deposits, withdrawals, and account management.' 
  },
  { 
    q: 'How many cryptocurrencies are supported?', 
    a: 'We list 200+ cryptocurrencies. Supported assets and pairs can vary by region and compliance requirements. We continuously add new assets based on market demand and regulatory compliance.' 
  },
  { 
    q: 'Is gold trading live?', 
    a: 'Yes. Live gold pairs trade alongside crypto markets, subject to regional availability and account verification. Gold prices are updated in real-time based on global market rates.' 
  },
  { 
    q: 'What is the minimum trade size?', 
    a: 'Minimum order size depends on the pair. The order ticket always shows the exact minimum before you place a trade. Most pairs have a minimum trade size of $10 equivalent value.' 
  },
  { 
    q: 'Can I place limit and market orders?', 
    a: 'Yes. Market and limit orders are supported. Additional advanced order types may roll out gradually. Limit orders allow you to set your desired price, while market orders execute immediately at current market rates.' 
  },
  { 
    q: 'How do I contact support?', 
    a: 'Use the Support dropdown for FAQ, Terms, Privacy, and Contact. Provide your account email for faster assistance. Our support team is available 24/7 via email and live chat to help with any questions or issues.' 
  },
  { 
    q: 'Are my funds secure?', 
    a: 'We enforce KYC, 2FA, encryption, and monitored withdrawals. Always enable 2FA and never share your codes. We use industry-standard security measures including cold storage for the majority of funds and regular security audits.' 
  },
  { 
    q: 'What wallets are compatible?', 
    a: 'Any wallet that can send supported assets on the correct network. Double-check network selection before transfers. We support all standard cryptocurrency wallets including MetaMask, Trust Wallet, Ledger, and Trezor.' 
  },
  { 
    q: 'Can I change my username?', 
    a: 'Yes. Update it in Profile after login. Some characters may be restricted to prevent impersonation. Username changes are limited to once per month for security reasons.' 
  },
  { 
    q: 'How do I view my transaction history?', 
    a: 'Go to Dashboard or Profile to export deposits, withdrawals, trades, and Earn activity in CSV format. Transaction history includes detailed information about all your account activities with timestamps and transaction IDs.' 
  },
  { 
    q: 'Which networks do you support?', 
    a: 'Common networks include Ethereum, BSC, Tron, and others per asset. The deposit screen lists the networks we support for that asset. We support major blockchain networks including ERC-20, BEP-20, TRC-20, and more.' 
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080915] via-[#0b0c1a] to-[#0d0f25] text-white">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet" />
      </Head>
      <Header />

      <main className="max-w-6xl mx-auto py-16" style={{ 
        paddingLeft: isMobile ? '20px' : '150px', 
        paddingRight: isMobile ? '20px' : '150px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1200px'
      }}>
        {/* Header Section */}
        <div className="text-center" style={{ marginBottom: '50px' }}>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4" style={{ 
            letterSpacing: '-0.02em', 
            lineHeight: '1.6',
            fontSize: isMobile ? '28px' : '48px'
          }}>
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto" style={{ 
            lineHeight: '1.8',
            fontSize: isMobile ? '14px' : '18px',
            paddingLeft: isMobile ? '0' : '0',
            paddingRight: isMobile ? '0' : '0'
          }}>
            Answers about trading, Earn, security, onboarding, and account management on Synax.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl shadow-xl shadow-black/40 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
              style={{
                background: '#0b0c1a',
                backgroundColor: '#0b0c1a',
                backdropFilter: 'blur(10px)',
                border: 'none',
                outline: 'none',
              }}
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between text-left transition-colors hover:bg-white/5 rounded-t-2xl"
                style={{
                  minHeight: isMobile ? '60px' : '72px',
                  backgroundColor: 'transparent',
                  background: 'transparent',
                  padding: isMobile ? '16px' : '24px 24px 20px 24px',
                }}
              >
                <span 
                  className="font-bold underline decoration-2 underline-offset-4"
                  style={{
                    fontFamily: 'Candara, sans-serif',
                    color: '#e5e7eb',
                    fontSize: isMobile ? '16px' : '24px',
                    textDecorationColor: 'rgba(255, 255, 255, 0.3)',
                    lineHeight: '1.5',
                    flex: 1,
                    textAlign: 'left',
                    paddingRight: '16px',
                  }}
                >
                  {item.q}
                </span>
                <span 
                  className="font-light flex-shrink-0 transition-transform duration-300"
                  style={{
                    color: '#e5e7eb',
                    fontSize: isMobile ? '16px' : '24px',
                    transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              </button>
              {openIndex === idx && (
                <div 
                  className="text-base leading-relaxed font-medium text-blue-300"
                  style={{
                    lineHeight: '1.8',
                    fontSize: isMobile ? '14px' : '16px',
                    color: '#60a5fa',
                    padding: isMobile ? '0 16px 16px 16px' : '8px 24px 24px 24px',
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
