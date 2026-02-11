// pages/api/withdraw/create.js - Create Withdrawal Request
import { createServerClient } from '../../../lib/supabase';
import { sendTelegramNotification, formatWithdrawalNotification } from '../../../lib/telegram-notification';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, coin, network, address, payment_method, bank_account, crypto_address, crypto_network } = req.body;

    // Normalize amount (support both comma and dot as decimal separator)
    const rawAmount = typeof amount === 'string' ? amount.replace(',', '.') : amount;
    const amountNum = parseFloat(rawAmount);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Determine payment method from coin/network or use provided
    let finalPaymentMethod = payment_method;
    let finalCryptoAddress = crypto_address || address;
    let finalCryptoNetwork = crypto_network || network;

    // If coin is provided, it's crypto withdrawal
    if (coin && !finalPaymentMethod) {
      finalPaymentMethod = 'crypto';
    }

    if (!finalPaymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // KYC kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance, kyc_verified, kyc_status')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.kyc_verified || profile.kyc_status !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC verification is required. Please complete your KYC verification to withdraw funds.',
        kyc_required: true 
      });
    }

    const finalCoin = coin?.toUpperCase?.() || null;
    const isCryptoWithdrawal = finalPaymentMethod === 'crypto' && finalCoin;

    if (isCryptoWithdrawal) {
      // --- CRYPTO WITHDRAWAL: amount is in crypto (e.g. 0.92 ETH) ---
      if (!['BTC', 'ETH', 'USDT', 'XRP'].includes(finalCoin)) {
        return res.status(400).json({ error: `Unsupported coin: ${finalCoin}` });
      }

      // Get current price in USDT for minimum check (Binance primary, fallback price_history)
      let currentPriceInUSDT = finalCoin === 'USDT' ? 1 : 0;
      if (finalCoin !== 'USDT') {
        try {
          const binanceSymbol = `${finalCoin}USDT`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const priceRes = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
            { headers: { 'Accept': 'application/json' }, signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (priceRes.ok) {
            const data = await priceRes.json();
            if (data?.price) {
              const p = parseFloat(data.price);
              if (p > 0) currentPriceInUSDT = p;
            }
          }
        } catch (e) { /* Binance failed */ }
        if (!currentPriceInUSDT || currentPriceInUSDT <= 0) {
          const { data: ph } = await supabaseAdmin
            .from('price_history')
            .select('price')
            .eq('asset_type', 'crypto')
            .eq('asset_symbol', finalCoin)
            .order('last_updated', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (ph?.price) {
            const p = parseFloat(ph.price);
            if (p > 0) currentPriceInUSDT = p;
          }
        }
        if (!currentPriceInUSDT || currentPriceInUSDT <= 0) {
          return res.status(500).json({
            error: `Unable to fetch ${finalCoin} price. Please try again in a moment.`,
          });
        }
      }

      const amountUsdt = amountNum * currentPriceInUSDT;

      // Minimum withdrawal: 20 USDT equivalent
      const minWithdrawUsdt = 20;
      if (amountUsdt < minWithdrawUsdt) {
        return res.status(400).json({ 
          error: `Minimum withdrawal is ${minWithdrawUsdt} USDT (your ${amountNum} ${finalCoin} ≈ ${amountUsdt.toFixed(2)} USDT)`,
          minimum: minWithdrawUsdt
        });
      }

      // Balance check: portfolio (crypto holdings)
      if (finalCoin === 'USDT') {
        if (parseFloat(profile.balance || 0) < amountNum) {
          return res.status(400).json({ 
            error: 'Insufficient balance',
            available: parseFloat(profile.balance || 0),
            requested: amountNum
          });
        }
      } else {
        const { data: portfolio } = await supabaseAdmin
          .from('portfolio')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('asset_type', 'crypto')
          .or(`asset_id.eq.${finalCoin},asset_symbol.eq.${finalCoin}`)
          .limit(1)
          .single();

        const qty = portfolio ? parseFloat(portfolio.quantity || 0) : 0;
        if (qty < amountNum) {
          return res.status(400).json({ 
            error: 'Insufficient balance',
            available: qty,
            requested: amountNum
          });
        }
      }
    } else {
      // --- CASH/BANK WITHDRAWAL: amount is in USD ---
      if (parseFloat(profile.balance || 0) < amountNum) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          available: parseFloat(profile.balance || 0),
          requested: amountNum
        });
      }

      const minWithdraw = 50;
      if (amountNum < minWithdraw) {
        return res.status(400).json({ 
          error: `Minimum withdrawal is ${minWithdraw} USDT`,
          minimum: minWithdraw
        });
      }
    }

    // Payment method'a göre gerekli alanları kontrol et
    if (finalPaymentMethod === 'bank_transfer' && !bank_account) {
      return res.status(400).json({ error: 'Bank account required for bank transfer' });
    }

    if (finalPaymentMethod === 'crypto' && (!finalCryptoAddress || !finalCryptoNetwork)) {
      return res.status(400).json({ error: 'Crypto address and network required' });
    }

    // Withdrawal kaydı oluştur (pending)
    const withdrawalCurrency = isCryptoWithdrawal ? finalCoin : 'USD';
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amountNum,
        currency: withdrawalCurrency,
        payment_method: finalPaymentMethod,
        bank_account: bank_account || null,
        crypto_address: finalCryptoAddress || null,
        crypto_network: finalCryptoNetwork || null,
        status: 'pending',
        admin_notes: finalCoin ? `Coin: ${finalCoin}, Network: ${finalCryptoNetwork}` : null
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Withdrawal creation error:', withdrawalError);
      return res.status(500).json({ error: 'Failed to create withdrawal request' });
    }

    // Send Telegram notification for pending withdrawal
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, username, full_name')
        .eq('id', user.id)
        .single();
      
      const notifyUser = userProfile || { email: user?.email || 'N/A', username: user?.user_metadata?.username || 'N/A', full_name: user?.user_metadata?.full_name || 'N/A' };
      const message = formatWithdrawalNotification(withdrawal, notifyUser, amountNum);
      await sendTelegramNotification(message, { context: 'withdraw' });
    } catch (telegramError) {
      // Don't fail the request if Telegram notification fails
      console.error('Withdraw create - Telegram notification error:', telegramError);
    }

    // Freeze balance (in pending status)
    // Note: In real application, balance is only deducted when admin approves
    // Şimdilik sadece withdrawal kaydı oluşturuyoruz

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: {
        withdrawal_id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status
      }
    });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create withdrawal request'
    });
  }
}
