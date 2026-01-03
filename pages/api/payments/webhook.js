// pages/api/payments/webhook.js - Stripe Webhook Handler
import Stripe from 'stripe';
import { createServerClient } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

// Buffer helper for Next.js
async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabaseAdmin = createServerClient();

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update deposit record
      const { data: deposit } = await supabaseAdmin
        .from('deposits')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();

      if (deposit) {
        // Deposit'i completed olarak işaretle
        await supabaseAdmin
          .from('deposits')
          .update({
            status: 'completed',
            transaction_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', deposit.id);

        // Update user balance
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', deposit.user_id)
          .single();

        if (profile) {
          const newBalance = parseFloat(profile.balance || 0) + parseFloat(deposit.amount);
          await supabaseAdmin
            .from('profiles')
            .update({
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', deposit.user_id);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      // Deposit'i failed olarak işaretle
      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return res.status(200).json({ received: true });
}

