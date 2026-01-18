// pages/api/admin/user-details.js - Admin fetch user assets/payments/trades
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const [
      { data: userProfile },
      { data: portfolio },
      { data: deposits },
      { data: withdrawals },
      { data: subscriptions },
      { data: tradingHistory },
      { data: binaryTrades },
      { data: kycDocuments },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', user_id).single(),
      supabaseAdmin.from('portfolio').select('*').eq('user_id', user_id),
      supabaseAdmin.from('deposits').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('withdrawals').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('earn_subscriptions').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('trading_history').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('binary_trades').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('kyc_documents').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        profile: userProfile || null,
        balance: userProfile?.balance ?? 0,
        portfolio: portfolio || [],
        deposits: deposits || [],
        withdrawals: withdrawals || [],
        earn_subscriptions: subscriptions || [],
        trading_history: tradingHistory || [],
        binary_trades: binaryTrades || [],
        kyc_documents: kycDocuments || [],
      },
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch user details' });
  }
}
