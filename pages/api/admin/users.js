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

    return res.status(200).json({
      success: true,
      data: filteredUsers
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}












