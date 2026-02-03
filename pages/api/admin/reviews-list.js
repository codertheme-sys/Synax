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

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        status,
        admin_notes,
        created_at,
        updated_at,
        profiles!reviews_user_id_fkey (
          id,
          username,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      console.error('Admin reviews fetch error:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      admin_notes: review.admin_notes,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user: {
        id: review.profiles?.id,
        username: review.profiles?.username || review.profiles?.full_name || 'N/A',
        email: review.profiles?.email || 'N/A'
      }
    }));

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
