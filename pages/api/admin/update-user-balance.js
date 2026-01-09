// pages/api/admin/update-user-balance.js - Update User Balance (Admin Only)
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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, balance } = req.body;

    if (!userId || balance === undefined || balance === null) {
      return res.status(400).json({ error: 'User ID and balance are required' });
    }

    const balanceValue = parseFloat(balance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      return res.status(400).json({ error: 'Invalid balance value' });
    }

    // Update user balance using service role
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: balanceValue })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return res.status(500).json({ error: 'Failed to update balance', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        userId: updatedProfile.id,
        balance: updatedProfile.balance
      }
    });

  } catch (error) {
    console.error('Update user balance error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user balance'
    });
  }
}









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

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, balance } = req.body;

    if (!userId || balance === undefined || balance === null) {
      return res.status(400).json({ error: 'User ID and balance are required' });
    }

    const balanceValue = parseFloat(balance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      return res.status(400).json({ error: 'Invalid balance value' });
    }

    // Update user balance using service role
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: balanceValue })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return res.status(500).json({ error: 'Failed to update balance', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      data: {
        userId: updatedProfile.id,
        balance: updatedProfile.balance
      }
    });

  } catch (error) {
    console.error('Update user balance error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user balance'
    });
  }
}














