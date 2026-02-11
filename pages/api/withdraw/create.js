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

      // Get current price for minimum check
      let currentPrice = 1;
      if (finalCoin !== 'USDT') {
        const coinGeckoIds = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'XRP': 'ripple' };
        try {
          const priceRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds[finalCoin]}&vs_currencies=usd`,
            { headers: { 'Accept': 'application/json' } }
          );
          if (priceRes.ok) {
            const data = await priceRes.json();
            const d = data[coinGeckoIds[finalCoin]];
            if (d?.usd != null) currentPrice = parseFloat(d.usd);
          }
        } catch (e) {
          const { data: ph } = await supabaseAdmin
            .from('price_history')
            .select('price')
            .or(`asset_id.eq.${finalCoin},asset_symbol.eq.${finalCoin}`)
            .eq('asset_type', 'crypto')
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();
          if (ph?.price) currentPrice = parseFloat(ph.price);
        }
      }

      const amountUsd = amountNum * currentPrice;

      // Minimum withdrawal: $20 USD equivalent
      const minWithdrawUsd = 20;
      if (amountUsd < minWithdrawUsd) {
        return res.status(400).json({ 
          error: `Minimum withdrawal is $${minWithdrawUsd} (your ${amountNum} ${finalCoin} ≈ $${amountUsd.toFixed(2)} USD)`,
          minimum: minWithdrawUsd
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
          error: `Minimum withdrawal is $${minWithdraw}`,
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
      
      const notifyUser = userProfile || { email: 'N/A', username: 'N/A' };
      const message = formatWithdrawalNotification(withdrawal, notifyUser, amountNum);
      await sendTelegramNotification(message);
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
