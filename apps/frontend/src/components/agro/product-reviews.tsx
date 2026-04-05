'use client';

import { useState } from 'react';
import { getProductReviews, createReview, voteReview } from '@/lib/api';
import type { ProductReviews, Review } from '@/lib/api';

export default function ProductReviews({
  productId,
  initialData,
}: {
  productId: string;
  initialData?: ProductReviews;
}) {
  const [reviews, setReviews] = useState<ProductReviews | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getProductReviews(productId, page);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createReview({
        productId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
      });
      setShowForm(false);
      setFormData({ rating: 5, title: '', comment: '' });
      alert('Review submitted! It will appear after approval.');
      loadReviews();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  const handleVote = async (reviewId: string, helpful: boolean) => {
    try {
      await voteReview(reviewId, helpful);
      loadReviews();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reviews ({reviews?.totalReviews || 0})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Write a Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold">Write Your Review</h3>
          
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Summarize your experience"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Review</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full p-2 border rounded-lg h-32"
              placeholder="Share your experience with this product"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews?.ratingDistribution && (
        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold">{reviews.averageRating.toFixed(1)}</div>
          <div>{renderStars(Math.round(reviews.averageRating))}</div>
          <div className="text-sm text-gray-600">({reviews.totalReviews} reviews)</div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      ) : reviews?.reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No reviews yet. Be the first to review!</div>
      ) : (
        <div className="space-y-4">
          {reviews?.reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                    {review.user?.firstName?.[0] || 'U'}
                  </div>
                  <span className="font-medium">
                    {review.user?.firstName} {review.user?.lastName}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                {renderStars(review.rating)}
                <span className="font-semibold">{review.title}</span>
              </div>
              
              <p className="text-gray-700">{review.comment}</p>
              
              {review.sellerResponse && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium text-green-600">Seller Response:</span>
                  <p className="mt-1">{review.sellerResponse}</p>
                </div>
              )}
              
              <div className="mt-2 flex items-center gap-4 text-sm">
                <button
                  onClick={() => handleVote(review.id, true)}
                  className="text-gray-500 hover:text-green-600"
                >
                  Helpful ({review.helpfulCount})
                </button>
                <button
                  onClick={() => handleVote(review.id, false)}
                  className="text-gray-500 hover:text-red-600"
                >
                  Not Helpful ({review.notHelpfulCount})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}