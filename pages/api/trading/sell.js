// pages/api/trading/sell.js - Real Money Sell Transaction
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

    // Portföyü kontrol et - asset_id ve asset_symbol ile esnek arama
    let { data: portfolio } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('user_id', user.id)
      .eq('asset_id', asset_id)
      .eq('asset_type', asset_type)
      .single();

    // Eğer bulunamazsa, asset_symbol ile dene
    if (!portfolio) {
      const { data: portfolioBySymbol } = await supabaseAdmin
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_symbol', asset_symbol)
        .eq('asset_type', asset_type)
        .single();
      portfolio = portfolioBySymbol;
    }

    if (!portfolio) {
      return res.status(404).json({ 
        error: 'Asset not found in portfolio',
        details: `You don't have any ${asset_symbol} in your portfolio. Please buy some first.`
      });
    }

    const availableQuantity = parseFloat(portfolio.quantity);
    const sellQuantity = parseFloat(quantity);

    if (availableQuantity < sellQuantity) {
      return res.status(400).json({ 
        error: 'Insufficient quantity',
        available: availableQuantity,
        requested: sellQuantity
      });
    }

    // Toplam tutar hesapla
    const totalAmount = sellQuantity * parseFloat(price);
    const fee = totalAmount * 0.005; // %0.5 işlem ücreti
    const totalAfterFee = totalAmount - fee;

    // Yeni miktar
    const newQuantity = availableQuantity - sellQuantity;

    // Update balance
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    const newBalance = parseFloat(profile.balance || 0) + totalAfterFee;
    await supabaseAdmin
      .from('profiles')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Update or delete portfolio
    if (newQuantity === 0) {
      // Tümü satıldı, portföyden sil
      await supabaseAdmin
        .from('portfolio')
        .delete()
        .eq('id', portfolio.id);
    } else {
      // Güncel fiyatı al
      const currentPrice = parseFloat(price);
      const totalValue = newQuantity * currentPrice;
      const profitLoss = totalValue - (newQuantity * parseFloat(portfolio.average_price));
      const profitLossPercent = portfolio.average_price > 0 
        ? ((currentPrice - portfolio.average_price) / portfolio.average_price) * 100 
        : 0;

      // Update portfolio
      await supabaseAdmin
        .from('portfolio')
        .update({
          quantity: newQuantity,
          current_price: currentPrice,
          total_value: totalValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolio.id);
    }

    // Trading history'ye ekle
    await supabaseAdmin
      .from('trading_history')
      .insert({
        user_id: user.id,
        asset_type,
        asset_id,
        asset_symbol,
        asset_name,
        trade_type: 'sell',
        quantity: sellQuantity,
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
        side: 'sell',
        order_type: 'market',
        quantity: sellQuantity,
        filled_quantity: sellQuantity,
        price: parseFloat(price),
        total_amount: totalAmount,
        fee: fee,
        status: 'filled',
        filled_at: new Date().toISOString()
      });

    return res.status(200).json({
      success: true,
      message: 'Sale completed successfully',
      data: {
        new_balance: newBalance,
        fee: fee,
        total_received: totalAfterFee,
        remaining_quantity: newQuantity
      }
    });

  } catch (error) {
    console.error('Sell trade error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process sale'
    });
  }
}

