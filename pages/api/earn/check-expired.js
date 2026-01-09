// pages/api/earn/check-expired.js - Check and complete expired locked subscriptions
// This should be called by a cron job periodically (e.g., every hour)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createServerClient();
    const now = new Date().toISOString();

    // Find all active locked subscriptions that have expired
    const { data: expiredSubscriptions, error: fetchError } = await supabaseAdmin
      .from('earn_subscriptions')
      .select('*, earn_products(*)')
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', now);

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch expired subscriptions', details: fetchError.message });
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No expired subscriptions found',
        processed: 0
      });
    }

    let processed = 0;
    const errors = [];

    for (const subscription of expiredSubscriptions) {
      try {
        const product = subscription.earn_products || {};
        const apr = parseFloat(product.apr || 0);
        const amount = parseFloat(subscription.amount || 0);
        const startDate = new Date(subscription.start_date);
        const endDate = new Date(subscription.end_date);
        const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Calculate full earnings for completed locked subscription
        // Formula: Amount × (APR / 100) × (Total Days / 365)
        const earnedAmount = amount * (apr / 100) * (totalDays / 365);
        const roundedEarned = Math.round(earnedAmount * 100000000) / 100000000;
        const refundAmount = amount + roundedEarned;
        const roundedRefund = Math.round(refundAmount * 100000000) / 100000000;

        // Get user balance
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', subscription.user_id)
          .single();

        if (profileError) {
          errors.push({ subscriptionId: subscription.id, error: 'Failed to fetch user balance' });
          continue;
        }

        const currentBalance = parseFloat(profile.balance || 0);
        const newBalance = currentBalance + roundedRefund;

        // Update balance
        const { error: balanceError } = await supabaseAdmin
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', subscription.user_id);

        if (balanceError) {
          errors.push({ subscriptionId: subscription.id, error: 'Failed to update balance' });
          continue;
        }

        // Update subscription to completed
        const { error: updateError } = await supabaseAdmin
          .from('earn_subscriptions')
          .update({
            status: 'completed',
            earned_amount: roundedEarned,
            total_earned: roundedEarned,
            cancelled_at: now,
            cancellation_type: 'completed',
            updated_at: now
          })
          .eq('id', subscription.id);

        if (updateError) {
          // Rollback balance if update fails
          await supabaseAdmin
            .from('profiles')
            .update({ balance: currentBalance })
            .eq('id', subscription.user_id);
          
          errors.push({ subscriptionId: subscription.id, error: 'Failed to update subscription' });
          continue;
        }

        processed++;
      } catch (error) {
        errors.push({ subscriptionId: subscription.id, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      processed: processed,
      total: expiredSubscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Check expired subscriptions API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}




