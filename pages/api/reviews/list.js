// pages/api/reviews/list.js - List Approved Reviews (Public)
import { createServerClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createServerClient();
    const { limit = 50, offset = 0, user_id } = req.query;

    // Get approved reviews
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, comment, created_at, updated_at, user_id')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    console.log('[REVIEWS LIST] Fetched approved reviews:', {
      count: reviews?.length || 0,
      reviews: reviews?.map(r => ({ id: r.id, user_id: r.user_id }))
    });

    // Get user profiles for all reviews
    const userIds = [...new Set((reviews || []).map(r => r.user_id).filter(Boolean))];
    let profilesMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      
      if (!profilesError && profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
        console.log('[REVIEWS LIST] Fetched profiles:', {
          count: profiles.length,
          profiles: profiles.map(p => ({ id: p.id, username: p.username }))
        });
      } else if (profilesError) {
        console.error('[REVIEWS LIST] Profiles fetch error:', profilesError);
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    if (countError) {
      console.error('Count error:', countError);
    }

    // Calculate average rating
    const { data: ratingsData, error: ratingsError } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('status', 'approved');

    let averageRating = 0;
    if (!ratingsError && ratingsData && ratingsData.length > 0) {
      const sum = ratingsData.reduce((acc, review) => acc + review.rating, 0);
      averageRating = sum / ratingsData.length;
    }

    // Format reviews with user display name
    const formattedReviews = (reviews || []).map(review => {
      const profile = profilesMap[review.user_id];
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
        user_name: profile?.username || profile?.full_name || 'Anonymous'
      };
    });

    console.log('[REVIEWS LIST] Formatted reviews:', {
      count: formattedReviews.length,
      reviews: formattedReviews.map(r => ({ id: r.id, user_name: r.user_name }))
    });

    // If user_id is provided, also return user's review (if exists)
    let userReview = null;
    if (user_id) {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          
          if (user && user.id === user_id) {
            const { data: userReviewData } = await supabaseAdmin
              .from('reviews')
              .select('id, rating, comment, status, created_at')
              .eq('user_id', user_id)
              .maybeSingle();
            
            if (userReviewData) {
              userReview = {
                id: userReviewData.id,
                rating: userReviewData.rating,
                comment: userReviewData.comment,
                status: userReviewData.status,
                created_at: userReviewData.created_at
              };
            }
          }
        }
      } catch (error) {
        // Ignore errors for user review check
        console.log('User review check error (non-critical):', error);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews: formattedReviews,
        total: count || 0,
        average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        total_reviews: ratingsData?.length || 0,
        user_review: userReview
      }
    });

  } catch (error) {
    console.error('List reviews error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews'
    });
  }
}
