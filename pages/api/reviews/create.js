// pages/api/reviews/create.js - Create Review
import { createServerClient } from '../../../lib/supabase';
import { filterText } from '../../../lib/spam-filter';

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

    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Validate and filter comment
    if (!comment || typeof comment !== 'string') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const filterResult = filterText(comment);
    if (!filterResult.isValid) {
      return res.status(400).json({ 
        error: filterResult.reason || 'Invalid comment content',
        filtered: filterResult.filteredText
      });
    }

    // Check if user already has a review
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingReview) {
      // If review is rejected, allow user to create a new one
      if (existingReview.status === 'rejected') {
        // Delete the rejected review
        await supabaseAdmin
          .from('reviews')
          .delete()
          .eq('id', existingReview.id);
      } else {
        return res.status(400).json({ 
          error: 'You have already submitted a review',
          existing_review_id: existingReview.id
        });
      }
    }

    // Create review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .insert({
        user_id: user.id,
        rating: parseInt(rating),
        comment: filterResult.filteredText,
        status: 'pending'
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      return res.status(500).json({ error: 'Failed to create review' });
    }

    return res.status(200).json({
      success: true,
      message: 'Review submitted successfully. It will be reviewed by an admin.',
      data: review
    });

  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create review'
    });
  }
}
