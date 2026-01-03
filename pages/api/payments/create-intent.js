// pages/api/payments/create-intent.js - Stripe Payment Intent Oluştur
import Stripe from 'stripe';
import { createServerClient } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

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

    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // KYC kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('kyc_verified, kyc_status')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.kyc_verified || profile.kyc_status !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC verification required',
        kyc_required: true 
      });
    }

    // Stripe Payment Intent oluştur
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe cent cinsinden çalışır
      currency: currency.toLowerCase(),
      metadata: {
        user_id: user.id,
        type: 'deposit'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Deposit kaydı oluştur (pending)
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: currency.toUpperCase(),
        payment_method: 'stripe',
        payment_provider: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending'
      })
      .select()
      .single();

    if (depositError) {
      console.error('Deposit creation error:', depositError);
      // Payment intent'i iptal et
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return res.status(500).json({ error: 'Failed to create deposit record' });
    }

    return res.status(200).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      deposit_id: deposit.id
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
}

