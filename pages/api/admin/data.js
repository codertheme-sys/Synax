// pages/api/admin/data.js - Admin Dashboard Verileri
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

    // Fetch all users from auth.users first to get only active users
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const activeUserIds = authUsers?.users?.map(u => u.id) || [];
    
    // Fetch all data - only profiles that exist in auth.users
    const [
      { data: allUsers, count: usersCount },
      { data: pendingKyc },
      { data: allDeposits, error: depositsError },
      { data: allWithdrawals, error: withdrawalsError },
      { data: recentTrades },
    ] = await Promise.all([
      activeUserIds.length > 0 
        ? supabaseAdmin.from('profiles').select('*', { count: 'exact' }).in('id', activeUserIds)
        : { data: [], count: 0, error: null },
      activeUserIds.length > 0
        ? supabaseAdmin.from('profiles').select('*').in('id', activeUserIds).in('kyc_status', ['pending']).limit(10)
        : { data: [], error: null },
      supabaseAdmin.from('deposits').select('*').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('trading_history').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    
    // Filter out any profiles that don't have corresponding auth.users
    const filteredAllUsers = (allUsers || []).filter(user => activeUserIds.includes(user.id));
    const filteredPendingKyc = (pendingKyc || []).filter(user => activeUserIds.includes(user.id));

    // Removed debug logs

    // Separate deposits by status
    const pendingDeposits = allDeposits?.filter(d => d.status === 'pending' || d.status === 'processing') || [];
    const approvedDeposits = allDeposits?.filter(d => d.status === 'completed') || [];
    const rejectedDeposits = allDeposits?.filter(d => d.status === 'rejected' || d.status === 'failed' || d.status === 'cancelled') || [];

    // Separate withdrawals by status
    const pendingWithdrawals = allWithdrawals?.filter(w => w.status === 'pending' || w.status === 'processing') || [];
    const approvedWithdrawals = allWithdrawals?.filter(w => w.status === 'completed') || [];
    const rejectedWithdrawals = allWithdrawals?.filter(w => w.status === 'rejected' || w.status === 'failed' || w.status === 'cancelled') || [];
    
    if (depositsError) {
      console.error('API - Deposits fetch error:', depositsError);
    }
    
    // Removed debug logs

    // Fetch KYC documents for pending KYC users (all documents, not just pending status)
    const pendingKycUserIds = pendingKyc?.map(u => u.id) || [];
    let pendingKycDocuments = [];
    
    // First, try to fetch all KYC documents to see if table exists and has data
    // Only for active users
    const { data: allKycDocs, error: allKycError } = activeUserIds.length > 0
      ? await supabaseAdmin
          .from('kyc_documents')
          .select('*')
          .in('user_id', activeUserIds)
          .order('created_at', { ascending: false })
          .limit(100)
      : { data: [], error: null };
    
    // Removed debug logs
    
    if (pendingKycUserIds.length > 0) {
      const { data: kycDocs, error: kycError } = await supabaseAdmin
        .from('kyc_documents')
        .select('*')
        .in('user_id', pendingKycUserIds)
        .order('created_at', { ascending: false });
      
      if (kycError) {
        console.error('KYC documents fetch error:', kycError);
      } else {
        // Filter to only include documents for active users
        pendingKycDocuments = (kycDocs || []).filter(doc => activeUserIds.includes(doc.user_id));
      }
    }
    
    // Removed debug logs
    
    // Also return all KYC docs for debugging - only for active users
    const allKycDocsForResponse = (allKycDocs || []).filter(doc => activeUserIds.includes(doc.user_id));

    // Fetch user emails for deposits and withdrawals separately
    const depositUserIds = [...new Set(allDeposits?.map(d => d.user_id).filter(Boolean) || [])];
    const withdrawalUserIds = [...new Set(allWithdrawals?.map(w => w.user_id).filter(Boolean) || [])];
    const allPaymentUserIds = [...new Set([...depositUserIds, ...withdrawalUserIds])];
    
    const { data: paymentUserProfiles } = allPaymentUserIds.length > 0 
      ? await supabaseAdmin.from('profiles').select('id, email, full_name').in('id', allPaymentUserIds)
      : { data: [] };

    const paymentUserMap = {};
    paymentUserProfiles?.forEach(u => {
      paymentUserMap[u.id] = u;
    });

    // Helper function to add email to deposits/withdrawals
    const addEmailToItems = (items) => {
      return items?.map(item => {
        const userProfile = paymentUserMap[item.user_id] || { email: item.user_id, full_name: null };
        return {
          ...item,
          profiles: userProfile
        };
      }) || [];
    };

    // Add emails to all deposit and withdrawal arrays
    const depositsWithEmail = {
      pending: addEmailToItems(pendingDeposits),
      approved: addEmailToItems(approvedDeposits),
      rejected: addEmailToItems(rejectedDeposits),
    };

    const withdrawalsWithEmail = {
      pending: addEmailToItems(pendingWithdrawals),
      approved: addEmailToItems(approvedWithdrawals),
      rejected: addEmailToItems(rejectedWithdrawals),
    };

    // Fetch user emails for trades
    const tradeUserIds = [...new Set(recentTrades?.map(t => t.user_id) || [])];
    const { data: tradeUserProfiles } = tradeUserIds.length > 0 
      ? await supabaseAdmin.from('profiles').select('id, email, full_name').in('id', tradeUserIds)
      : { data: [] };

    const tradeUserMap = {};
    tradeUserProfiles?.forEach(u => {
      tradeUserMap[u.id] = u;
    });

    const tradesWithEmail = recentTrades?.map(t => ({
      ...t,
      profiles: tradeUserMap[t.user_id] || { email: t.user_id }
    })) || [];

    // İstatistikler hesapla - use filtered users
    const totalUsers = filteredAllUsers.length || 0;
    const activeUsers = filteredAllUsers?.filter(u => u.kyc_status === 'approved').length || 0;
    const totalVolume = recentTrades?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0;
    const totalRevenue = recentTrades?.reduce((sum, t) => sum + parseFloat(t.fee || 0), 0) || 0;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          pendingKyc: filteredPendingKyc?.length || 0,
          totalVolume,
          totalRevenue,
        },
        allUsers: filteredAllUsers || [],
        pendingKyc: filteredPendingKyc || [],
        pendingKycDocuments: pendingKycDocuments || [],
        allKycDocuments: (allKycDocs || []).filter(doc => activeUserIds.includes(doc.user_id)), // For debugging - only active users
        pendingDeposits: depositsWithEmail.pending, // Keep for backward compatibility
        pendingWithdrawals: withdrawalsWithEmail.pending, // Keep for backward compatibility
        deposits: depositsWithEmail, // All deposits by status
        withdrawals: withdrawalsWithEmail, // All withdrawals by status
        recentTrades: tradesWithEmail,
      }
    });

  } catch (error) {
    console.error('Admin data error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch admin data'
    });
  }
}

