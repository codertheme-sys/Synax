// pages/api/admin/deposit-approve.js - Deposit Onay/Red
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

    const { deposit_id, action, notes } = req.body; // action: 'approve' or 'reject'

    if (!deposit_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Deposit bilgilerini al
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .single();

    if (depositError || !deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if deposit is already processed
    if (deposit.status !== 'pending' && deposit.status !== 'processing') {
      return res.status(400).json({ 
        success: false,
        error: `Deposit already ${deposit.status}. Cannot process again.` 
      });
    }

    if (action === 'approve') {
      // Increase balance
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', deposit.user_id)
        .single();

      const newBalance = parseFloat(userProfile.balance || 0) + parseFloat(deposit.amount);
      await supabaseAdmin
        .from('profiles')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit.user_id);

      // Deposit'i onayla (processed_at and processed_by columns don't exist in schema)
      const { data: updatedDeposit, error: updateError } = await supabaseAdmin
        .from('deposits')
        .update({
          status: 'completed',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit_id)
        .select()
        .single();

      if (updateError) {
        console.error('Deposit approve - Update error:', updateError);
        throw updateError;
      }

      console.log('Deposit approve - Updated deposit:', {
        id: updatedDeposit.id,
        status: updatedDeposit.status,
        amount: updatedDeposit.amount
      });

      return res.status(200).json({
        success: true,
        message: 'Deposit approved successfully',
        deposit: updatedDeposit
      });
    } else if (action === 'reject') {
      // Deposit'i reddet (processed_at and processed_by columns don't exist in schema)
      await supabaseAdmin
        .from('deposits')
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deposit_id);

      return res.status(200).json({
        success: true,
        message: 'Deposit rejected'
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Deposit approve error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process deposit action'
    });
  }
}

