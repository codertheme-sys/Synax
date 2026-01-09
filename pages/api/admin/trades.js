// pages/api/admin/trades.js - Admin: list recent trades (spot + binary)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Admin auth
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

    // Fetch recent spot/convert trades from trading_history
    const { data: spotTrades } = await supabaseAdmin
      .from('trading_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch recent binary trades
    const { data: binaryTrades } = await supabaseAdmin
      .from('binary_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const normalizeSpot = (t) => ({
      id: t.id,
      user_id: t.user_id,
      asset_type: t.asset_type,
      asset_id: t.asset_id,
      asset_symbol: t.asset_symbol,
      asset_name: t.asset_name,
      trade_type: t.trade_type || 'spot',
      side: t.trade_type === 'sell' ? 'sell' : 'buy',
      quantity: t.quantity,
      price: t.price,
      total_amount: t.total_amount,
      fee: t.fee,
      status: t.status || 'completed',
      created_at: t.created_at,
    });

    const normalizeBinary = (t) => ({
      id: t.id,
      user_id: t.user_id,
      asset_type: t.asset_type,
      asset_id: t.asset_id,
      asset_symbol: t.asset_symbol,
      asset_name: t.asset_name,
      trade_type: 'binary',
      side: t.side,
      quantity: null,
      price: t.initial_price,
      total_amount: t.trade_amount,
      fee: 0,
      status: t.status,
      win_lost: t.win_lost,
      last_price: t.last_price,
      created_at: t.created_at,
    });

    const combined = [
      ...(spotTrades || []).map(normalizeSpot),
      ...(binaryTrades || []).map(normalizeBinary),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);

    // Attach user emails
    const userIds = [...new Set(combined.map(t => t.user_id).filter(Boolean))];
    const { data: userProfiles } = userIds.length
      ? await supabaseAdmin.from('profiles').select('id,email,full_name').in('id', userIds)
      : { data: [] };
    const userMap = {};
    (userProfiles || []).forEach(u => { userMap[u.id] = u; });
    const withEmails = combined.map(t => ({ ...t, profiles: userMap[t.user_id] || { email: t.user_id } }));

    return res.status(200).json({ success: true, data: withEmails });
  } catch (error) {
    console.error('Admin trades error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch trades' });
  }
}










