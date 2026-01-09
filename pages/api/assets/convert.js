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

    const { portfolio_id, asset_id, asset_type, asset_symbol, quantity, usd_value } = req.body;

    if (!portfolio_id || !asset_id || !asset_type || !asset_symbol || !quantity || !usd_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Get current portfolio item
    const { data: portfolioItem, error: portfolioError } = await supabaseAdmin
      .from('portfolio')
      .select('*')
      .eq('id', portfolio_id)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolioItem) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    const currentQuantity = parseFloat(portfolioItem.quantity || 0);
    if (quantity > currentQuantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Get current price from price_history
    const { data: priceData, error: priceError } = await supabaseAdmin
      .from('price_history')
      .select('price')
      .eq('asset_id', asset_id)
      .eq('asset_type', asset_type)
      .single();

    if (priceError || !priceData) {
      return res.status(404).json({ error: 'Price data not found' });
    }

    const currentPrice = parseFloat(priceData.price);
    const actualUsdValue = quantity * currentPrice;

    // Update user balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const newBalance = parseFloat(profile.balance || 0) + actualUsdValue;

    const { error: balanceUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balanceUpdateError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // Update portfolio - reduce quantity
    const newQuantity = currentQuantity - quantity;
    
    if (newQuantity <= 0) {
      // Remove portfolio item if quantity is 0 or less
      const { error: deleteError } = await supabaseAdmin
        .from('portfolio')
        .delete()
        .eq('id', portfolio_id);

      if (deleteError) {
        return res.status(500).json({ error: 'Failed to update portfolio' });
      }
    } else {
      // Update portfolio item
      const newTotalValue = newQuantity * currentPrice;
      const profitLoss = newTotalValue - (newQuantity * parseFloat(portfolioItem.average_price));
      const profitLossPercent = parseFloat(portfolioItem.average_price) > 0
        ? ((currentPrice - parseFloat(portfolioItem.average_price)) / parseFloat(portfolioItem.average_price)) * 100
        : 0;

      const { error: updateError } = await supabaseAdmin
        .from('portfolio')
        .update({
          quantity: newQuantity,
          current_price: currentPrice,
          total_value: newTotalValue,
          profit_loss: profitLoss,
          profit_loss_percent: profitLossPercent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolio_id);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update portfolio' });
      }
    }

    // Create convert history record
    const { error: convertHistoryError } = await supabaseAdmin
      .from('convert_history')
      .insert({
        user_id: user.id,
        portfolio_id: portfolio_id,
        asset_id: asset_id,
        asset_type: asset_type,
        asset_symbol: asset_symbol,
        quantity: quantity,
        price: currentPrice,
        usd_value: actualUsdValue,
        created_at: new Date().toISOString(),
      });

    if (convertHistoryError) {
      console.error('Error creating convert history:', convertHistoryError);
      // Don't fail the request if history creation fails
    }

    return res.status(200).json({
      success: true,
      message: 'Converted successfully',
      usd_value: actualUsdValue,
      new_balance: newBalance,
    });

  } catch (error) {
    console.error('Convert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert',
    });
  }
}

