// pages/api/earn/cancel.js - Cancel Earn Subscription
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth token kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createServerClient();
    
    // Token'dan user bilgisini al
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = user.id;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Get subscription details with product info
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('earn_subscriptions')
      .select('*, earn_products(*)')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    const product = subscription.earn_products || {};
    const productType = product.product_type || 'flexible';
    const apr = parseFloat(product.apr || 0);
    const amount = parseFloat(subscription.amount || 0);
    const startDate = new Date(subscription.start_date);
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
    const now = new Date();

    // Calculate days used
    const daysUsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = endDate ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;

    let earnedAmount = 0;
    let cancellationType = null;
    let refundAmount = amount;

    // Calculate earnings based on product type and cancellation scenario
    if (productType === 'flexible') {
      // Flexible: Pay proportional earnings based on days used
      // Formula: Amount × (APR / 100) × (Days Used / 365)
      earnedAmount = amount * (apr / 100) * (daysUsed / 365);
      cancellationType = 'user_cancelled';
      refundAmount = amount + earnedAmount; // Principal + earnings
    } else if (productType === 'locked') {
      // Locked: Check if early cancellation or completed
      if (endDate && now < endDate) {
        // Early cancellation: No earnings (penalty model)
        earnedAmount = 0;
        cancellationType = 'early';
        refundAmount = amount; // Only principal, no earnings
      } else if (endDate && now >= endDate) {
        // Completed: Full earnings
        // Formula: Amount × (APR / 100) × (Total Days / 365)
        earnedAmount = amount * (apr / 100) * (totalDays / 365);
        cancellationType = 'completed';
        refundAmount = amount + earnedAmount; // Principal + full earnings
      } else {
        // No end date but locked (shouldn't happen, but handle it)
        earnedAmount = 0;
        cancellationType = 'early';
        refundAmount = amount;
      }
    }

    // Round to 8 decimal places
    earnedAmount = Math.round(earnedAmount * 100000000) / 100000000;
    refundAmount = Math.round(refundAmount * 100000000) / 100000000;

    // Get user balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user balance' });
    }

    const currentBalance = parseFloat(profile.balance || 0);
    const newBalance = currentBalance + refundAmount;

    // Update balance
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Update subscription
    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from('earn_subscriptions')
      .update({
        status: 'cancelled',
        earned_amount: earnedAmount,
        total_earned: earnedAmount,
        cancelled_at: now.toISOString(),
        cancellation_type: cancellationType,
        updated_at: now.toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      // Rollback balance if update fails
      await supabaseAdmin
        .from('profiles')
        .update({ balance: currentBalance })
        .eq('id', userId);
      
      return res.status(500).json({ error: 'Failed to cancel subscription', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      data: updatedSubscription,
      earnedAmount: earnedAmount,
      refundAmount: refundAmount,
      newBalance: newBalance,
      cancellationType: cancellationType,
      daysUsed: daysUsed
    });

  } catch (error) {
    console.error('Earn cancel API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}



