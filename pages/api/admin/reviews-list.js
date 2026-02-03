// pages/api/admin/reviews-list.js - Admin: List All Reviews
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

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.query; // Optional filter by status

    // First, get all reviews
    let query = supabaseAdmin
      .from('reviews')
      .select('id, rating, comment, status, admin_notes, created_at, updated_at, user_id')
      .order('created_at', { ascending: false });

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Admin reviews fetch error:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    console.log('[ADMIN REVIEWS] Fetched reviews:', {
      count: reviews?.length || 0,
      reviews: reviews?.map(r => ({ id: r.id, status: r.status, user_id: r.user_id }))
    });

    // Get user profiles for all reviews
    const userIds = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
    let profilesMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, full_name, email')
        .in('id', userIds);
      
      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format reviews
    const formattedReviews = (reviews || []).map(review => {
      const profile = profilesMap[review.user_id];
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        admin_notes: review.admin_notes,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user: {
          id: profile?.id || review.user_id,
          username: profile?.username || profile?.full_name || 'N/A',
          email: profile?.email || 'N/A'
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedReviews
    });

  } catch (error) {
    console.error('Admin list reviews error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews'
    });
  }
}
