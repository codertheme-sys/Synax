// pages/api/withdraw/create.js - Create Withdrawal Request
import { createServerClient } from '../../../lib/supabase';

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

    if (!amount || amount <= 0) {
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
        error: 'KYC verification required',
        kyc_required: true 
      });
    }

    // Balance check
    if (parseFloat(profile.balance || 0) < parseFloat(amount)) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: parseFloat(profile.balance || 0),
        requested: parseFloat(amount)
      });
    }

    // Minimum withdrawal amount check
    const minWithdraw = finalPaymentMethod === 'crypto' ? 20 : 50;
    if (parseFloat(amount) < minWithdraw) {
      return res.status(400).json({ 
        error: `Minimum withdrawal is $${minWithdraw}`,
        minimum: minWithdraw
      });
    }

    // Payment method'a göre gerekli alanları kontrol et
    if (finalPaymentMethod === 'bank_transfer' && !bank_account) {
      return res.status(400).json({ error: 'Bank account required for bank transfer' });
    }

    if (finalPaymentMethod === 'crypto' && (!finalCryptoAddress || !finalCryptoNetwork)) {
      return res.status(400).json({ error: 'Crypto address and network required' });
    }

    // Withdrawal kaydı oluştur (pending)
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        currency: 'USD',
        payment_method: finalPaymentMethod,
        bank_account: bank_account || null,
        crypto_address: finalCryptoAddress || null,
        crypto_network: finalCryptoNetwork || null,
        status: 'pending',
        admin_notes: coin ? `Coin: ${coin}, Network: ${finalCryptoNetwork}` : null
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Withdrawal creation error:', withdrawalError);
      return res.status(500).json({ error: 'Failed to create withdrawal request' });
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




