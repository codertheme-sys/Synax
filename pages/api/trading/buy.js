// pages/api/trading/buy.js - Real Money Buy Transaction
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

    const { asset_type, asset_id, asset_symbol, asset_name, quantity, price } = req.body;

    if (!asset_type || !asset_id || !asset_symbol || !asset_name || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ error: 'Invalid quantity or price' });
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
        error: 'KYC verification is required. Please complete your KYC verification to start trading.',
        kyc_required: true 
      });
    }

    // Toplam tutar hesapla
    const totalAmount = parseFloat(quantity) * parseFloat(price);
    const fee = totalAmount * 0.005; // %0.5 işlem ücreti
    const totalWithFee = totalAmount + fee;

    // Balance check
    if (parseFloat(profile.balance || 0) < totalWithFee) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: totalWithFee,
        available: parseFloat(profile.balance || 0)
      });
    }

    // Mevcut portföyü kontrol et
    const { data: existing } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('asset_id', asset_id)
      .eq('asset_type', asset_type)
      .single();

    let newQuantity = parseFloat(quantity);
    let newAveragePrice = parseFloat(price);

    if (existing) {
      const oldQuantity = parseFloat(existing.quantity);
      const oldAveragePrice = parseFloat(existing.average_price);
      const oldTotalCost = oldQuantity * oldAveragePrice;
      const newTotalCost = newQuantity * newAveragePrice;
      
      // Ortalama fiyat hesapla
      newQuantity = oldQuantity + newQuantity;
      newAveragePrice = (oldTotalCost + newTotalCost) / newQuantity;
    }

    // Güncel fiyatı al
    const currentPrice = parseFloat(price);
    const totalValue = newQuantity * currentPrice;
    const profitLoss = totalValue - (newQuantity * newAveragePrice);
    const profitLossPercent = newAveragePrice > 0 
      ? ((currentPrice - newAveragePrice) / newAveragePrice) * 100 
      : 0;

    // Update balance
    const newBalance = parseFloat(profile.balance || 0) - totalWithFee;
    await supabaseAdmin
      .from('profiles')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Update or create portfolio
    const { data: portfolioItem, error: portfolioError } = await supabaseAdmin
      .from('portfolio')
      .upsert({
        user_id: user.id,
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        quantity: newQuantity,
        average_price: newAveragePrice,
        current_price: currentPrice,
        total_value: totalValue,
        profit_loss: profitLoss,
        profit_loss_percent: profitLossPercent
      }, {
        onConflict: 'user_id,asset_id,asset_type'
      })
      .select()
      .single();

    if (portfolioError) throw portfolioError;

    // Trading history'ye ekle
    await supabaseAdmin
      .from('trading_history')
      .insert({
        user_id: user.id,
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        trade_type: 'buy',
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        total_amount: totalAmount,
        fee: fee,
        status: 'completed'
      });

    // Create order record (for market orders, it's immediately filled)
    await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        side: 'buy',
        order_type: 'market',
        quantity: parseFloat(quantity),
        filled_quantity: parseFloat(quantity),
        price: parseFloat(price),
        total_amount: totalAmount,
        fee: fee,
        status: 'filled',
        filled_at: new Date().toISOString()
      });

    return res.status(200).json({
      success: true,
      message: 'Purchase completed successfully',
      data: {
        portfolio: portfolioItem,
        new_balance: newBalance,
        fee: fee,
        total_paid: totalWithFee
      }
    });

  } catch (error) {
    console.error('Buy trade error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process purchase'
    });
  }
}

