// pages/api/earn/subscribe.js - Subscribe to Earn Product
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
    const { productId, amount } = req.body;

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount are required' });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('earn_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      // If product not found in DB, use fallback - check min deposit
      const minDeposit = 500; // Default minimum
      if (amountValue < minDeposit) {
        return res.status(400).json({ error: `Minimum deposit is $${minDeposit}` });
      }
    } else {
      const minDeposit = parseFloat(product.min_deposit || 500);
      if (amountValue < minDeposit) {
        return res.status(400).json({ error: `Minimum deposit is $${minDeposit}` });
      }
    }

    // Check user balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to fetch user balance' });
    }

    const currentBalance = parseFloat(profile.balance || 0);
    if (currentBalance < amountValue) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct amount from balance
    const newBalance = currentBalance - amountValue;
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (balanceError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Create subscription
    const subscriptionData = {
      user_id: userId,
      product_id: productId,
      amount: amountValue,
      status: 'active',
      start_date: new Date().toISOString(),
    };

    // If product has duration, calculate end_date
    if (product && product.duration_days) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + product.duration_days);
      subscriptionData.end_date = endDate.toISOString();
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('earn_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      // Rollback balance if subscription creation fails
      await supabaseAdmin
        .from('profiles')
        .update({ balance: currentBalance })
        .eq('id', userId);
      
      console.error('Subscription creation error:', subscriptionError);
      return res.status(500).json({ 
        error: 'Failed to create subscription', 
        details: subscriptionError.message,
        code: subscriptionError.code,
        hint: subscriptionError.hint
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
      newBalance: newBalance
    });

  } catch (error) {
    console.error('Earn subscribe API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

