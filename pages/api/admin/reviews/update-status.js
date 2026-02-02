// pages/api/admin/reviews/update-status.js - Admin: Approve/Reject Review
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

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { review_id, action, admin_notes } = req.body; // action: 'approve' or 'reject'

    if (!review_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
    }

    // Get review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update review status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { data: updatedReview, error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        status: newStatus,
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', review_id)
      .select()
      .single();

    if (updateError) {
      console.error('Review update error:', updateError);
      return res.status(500).json({ error: 'Failed to update review' });
    }

    return res.status(200).json({
      success: true,
      message: `Review ${action}d successfully`,
      data: updatedReview
    });

  } catch (error) {
    console.error('Admin update review status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update review status'
    });
  }
}
