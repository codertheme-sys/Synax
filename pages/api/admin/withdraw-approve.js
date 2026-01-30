// pages/api/admin/withdraw-approve.js - Withdraw Onay/Red
import { createServerClient } from '../../../lib/supabase';
import { sendTelegramNotification, formatWithdrawalNotification } from '../../../lib/telegram-notification';

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
      // Balance check
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();

      if (parseFloat(userProfile.balance || 0) < parseFloat(withdrawal.amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Decrease balance
      const newBalance = parseFloat(userProfile.balance || 0) - parseFloat(withdrawal.amount);
      await supabaseAdmin
        .from('profiles')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal.user_id);

      // Withdrawal'ı onayla (processed_at and processed_by columns don't exist in schema)
      const { data: updatedWithdrawal } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'completed',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id)
        .select()
        .single();

      // Send Telegram notification
      try {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, username, full_name')
          .eq('id', withdrawal.user_id)
          .single();
        
        const user = userProfile || { email: 'N/A', username: 'N/A' };
        const message = formatWithdrawalNotification(updatedWithdrawal || withdrawal, user, parseFloat(withdrawal.amount));
        await sendTelegramNotification(message);
      } catch (telegramError) {
        // Don't fail the request if Telegram notification fails
        console.error('Withdraw approve - Telegram notification error:', telegramError);
      }

      return res.status(200).json({
        success: true,
        message: 'Withdrawal approved successfully'
      });
    } else if (action === 'reject') {
      // Withdrawal'ı reddet (processed_at and processed_by columns don't exist in schema)
      const { data: rejectedWithdrawal } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id)
        .select()
        .single();

      // Send Telegram notification for rejection
      try {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, username, full_name')
          .eq('id', withdrawal.user_id)
          .single();
        
        const user = userProfile || { email: 'N/A', username: 'N/A' };
        const message = formatWithdrawalNotification(rejectedWithdrawal || withdrawal, user, parseFloat(withdrawal.amount));
        await sendTelegramNotification(message);
      } catch (telegramError) {
        console.error('Withdraw reject - Telegram notification error:', telegramError);
      }

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

