// pages/api/admin/withdraw-approve.js - Withdraw Onay/Red
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

    // Admin kontrolü
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { withdrawal_id, action, notes } = req.body; // action: 'approve' or 'reject'

    if (!withdrawal_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Withdrawal bilgilerini al
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Check if withdrawal is already processed
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return res.status(400).json({ 
        success: false,
        error: `Withdrawal already ${withdrawal.status}. Cannot process again.` 
      });
    }

    if (action === 'approve') {
      const currency = (withdrawal.currency || 'USD').toUpperCase();
      const amount = parseFloat(withdrawal.amount);

      // Crypto withdrawal: deduct from portfolio
      if (['BTC', 'ETH', 'XRP'].includes(currency)) {
        const { data: portfolio } = await supabaseAdmin
          .from('portfolio')
          .select('id, quantity, average_price, total_value')
          .eq('user_id', withdrawal.user_id)
          .eq('asset_type', 'crypto')
          .or(`asset_id.eq.${currency},asset_symbol.eq.${currency}`)
          .limit(1)
          .single();

        if (!portfolio || parseFloat(portfolio.quantity || 0) < amount) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        const qty = parseFloat(portfolio.quantity || 0);
        const avgPrice = parseFloat(portfolio.average_price || 0);
        const newQty = qty - amount;
        const newTotalValue = newQty * avgPrice;

        if (newQty <= 0) {
          await supabaseAdmin.from('portfolio').delete().eq('id', portfolio.id);
        } else {
          await supabaseAdmin
            .from('portfolio')
            .update({
              quantity: newQty,
              total_value: newTotalValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', portfolio.id);
        }
      } else {
        // USD/USDT: deduct from balance
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', withdrawal.user_id)
          .single();

        if (!userProfile || parseFloat(userProfile.balance || 0) < amount) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        const newBalance = parseFloat(userProfile.balance || 0) - amount;
        await supabaseAdmin
          .from('profiles')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', withdrawal.user_id);
      }

      // Withdrawal'ı onayla (processed_at and processed_by columns don't exist in schema)
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id);

      return res.status(200).json({
        success: true,
        message: 'Withdrawal approved successfully'
      });
    } else if (action === 'reject') {
      // Withdrawal'ı reddet (processed_at and processed_by columns don't exist in schema)
      await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id);

      return res.status(200).json({
        success: true,
        message: 'Withdrawal rejected'
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Withdraw approve error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal action'
    });
  }
}

