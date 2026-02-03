// components/ReviewsSection.js - Reviews and Ratings Component
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const cardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 36, 0.95)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
};

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const reviewsPerPage = 10;

  useEffect(() => {
    checkUser();
    fetchReviews();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        checkUserReview(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const checkUserReview = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/reviews/list?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.user_review) {
          setUserReview(result.data.user_review);
        }
      }
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * reviewsPerPage;
      const response = await fetch(`/api/reviews/list?limit=${reviewsPerPage}&offset=${offset}`);
      const result = await response.json();

      console.log('[REVIEWS SECTION] API response:', {
        success: result.success,
        reviewsCount: result.data?.reviews?.length || 0,
        averageRating: result.data?.average_rating,
        totalReviews: result.data?.total_reviews
      });

      if (result.success) {
        if (page === 1) {
          setReviews(result.data.reviews || []);
        } else {
          setReviews(prev => [...prev, ...(result.data.reviews || [])]);
        }
        setAverageRating(result.data.average_rating || 0);
        setTotalReviews(result.data.total_reviews || 0);
        setHasMore((result.data.reviews || []).length === reviewsPerPage);
      } else {
        console.error('[REVIEWS SECTION] API error:', result.error);
        toast.error(result.error || 'Failed to load reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (comment.length > 300) {
      toast.error('Comment must be 300 characters or less');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please login to submit a review');
        return;
      }

      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Review submitted successfully! It will be reviewed by an admin.');
        setShowReviewForm(false);
        setRating(0);
        setComment('');
        checkUserReview(user.id);
        // Refresh reviews after a moment (admin might approve quickly)
        setTimeout(() => fetchReviews(1), 2000);
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchReviews(nextPage);
    }
  };

  const renderStars = (ratingValue, interactive = false, onStarClick = null) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            style={{
              fontSize: '20px',
              color: star <= ratingValue ? '#fbbf24' : '#6b7280',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'color 0.2s',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get first 5 reviews (directly visible)
  const first5Reviews = reviews.slice(0, 5);
  const remainingReviews = reviews.slice(5);

  return (
    <div style={{ ...cardStyle, padding: '32px', marginTop: '40px' }}>
      {/* Header with Average Rating */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>
          Customer Reviews
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#fbbf24' }}>
            {averageRating.toFixed(1)}
          </div>
          <div>
            {renderStars(Math.round(averageRating))}
            <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form (for logged in users who haven't reviewed) */}
      {user && !userReview && (
        <div style={{ marginBottom: '32px', padding: '24px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
            Write a Review
          </h3>
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Write Review
            </button>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Rating *
                </label>
                {renderStars(rating, true, setRating)}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Comment * (max 300 characters)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={300}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  placeholder="Share your experience..."
                />
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', textAlign: 'right' }}>
                  {comment.length}/300
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={submitting || rating === 0 || !comment.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: submitting || rating === 0 || !comment.trim() 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: submitting || rating === 0 || !comment.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || rating === 0 || !comment.trim() ? 0.5 : 1,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setComment('');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* User's Existing Review Status */}
      {user && userReview && (
        <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            Your review is {userReview.status === 'pending' ? 'pending approval' : userReview.status === 'approved' ? 'approved and visible' : 'rejected'}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          No reviews yet. Be the first to review!
        </div>
      ) : (
        <>
          {/* First 5 Reviews (Directly Visible) */}
          <div style={{ marginBottom: '24px' }}>
            {first5Reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  padding: '20px',
                  marginBottom: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {review.user_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <div style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6' }}>
                  {review.comment}
                </div>
              </div>
            ))}
          </div>

          {/* Remaining Reviews (Scrollable) */}
          {remainingReviews.length > 0 && (
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
              {remainingReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: '20px',
                    marginBottom: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                        {review.user_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6' }}>
                    {review.comment}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: loading ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewsSection;
