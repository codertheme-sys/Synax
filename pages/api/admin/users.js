// pages/api/admin/users.js - Get all users (only active users from auth.users)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Fetch all active users from auth.users first
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      return res.status(500).json({ error: 'Failed to fetch users', details: authUsersError.message });
    }

    const activeUserIds = authUsers?.users?.map(u => u.id) || [];

    // Fetch profiles only for active users
    const { data: allUsers, error: profilesError } = activeUserIds.length > 0
      ? await supabaseAdmin
          .from('profiles')
          .select('*')
          .in('id', activeUserIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return res.status(500).json({ error: 'Failed to fetch profiles', details: profilesError.message });
    }

    // Filter to ensure only active users are returned
    const filteredUsers = (allUsers || []).filter(user => activeUserIds.includes(user.id));

    // Calculate portfolio value for each user:
    // portfolioValue = assets (portfolio holdings excluding USDT) + active earn_products + cash balance
    let portfolioByUser = new Map();
    let earnByUser = new Map();
    try {
      const { data: portfoliosData, error: portfoliosError } = activeUserIds.length > 0
        ? await supabaseAdmin
            .from('portfolio')
            .select('user_id, quantity, total_value, asset_symbol, asset_id')
            .in('user_id', activeUserIds)
        : { data: [], error: null };

      if (portfoliosError) throw portfoliosError;

      (portfoliosData || []).forEach((p) => {
        const qty = parseFloat(p.quantity || 0);
        if (!(qty > 0)) return;
        const sym = (p.asset_symbol || '').toUpperCase();
        const id = (p.asset_id || '').toUpperCase();
        if (sym === 'USDT' || id === 'USDT') return;

        const v = parseFloat(p.total_value || 0);
        const prev = portfolioByUser.get(p.user_id) || 0;
        portfolioByUser.set(p.user_id, prev + v);
      });
    } catch (err) {
      console.error('Error fetching portfolios for admin users:', err);
    }

    try {
      const { data: earnSubsData, error: earnSubsError } = activeUserIds.length > 0
        ? await supabaseAdmin
            .from('earn_subscriptions')
            .select('user_id, amount, status')
            .in('user_id', activeUserIds)
        : { data: [], error: null };

      if (earnSubsError) throw earnSubsError;

      (earnSubsData || []).forEach((s) => {
        if ((s.status || '').toLowerCase() !== 'active') return;
        const v = parseFloat(s.amount || 0);
        const prev = earnByUser.get(s.user_id) || 0;
        earnByUser.set(s.user_id, prev + v);
      });
    } catch (err) {
      console.error('Error fetching earn subscriptions for admin users:', err);
    }

    filteredUsers.forEach((u) => {
      const cashBalance = parseFloat(u.balance || 0);
      const assetsValue = portfolioByUser.get(u.id) || 0;
      const earnProductsValue = earnByUser.get(u.id) || 0;
      u.portfolio_value = assetsValue + earnProductsValue + cashBalance;
    });

    return res.status(200).json({
      success: true,
      data: filteredUsers
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}












