/**
 * pages/MyBookings.jsx — Student's booking list with upcoming/past tabs
 * Supports cancellation of CONFIRMED future bookings and review submission for COMPLETED ones.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/bookings.js';
import { reviewsApi } from '../api/reviews.js';
import BookingCard from '../components/BookingCard.jsx';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingsApi.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    try {
      await bookingsApi.cancel(id);
      // Refresh bookings list to show updated status
      await fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewBooking) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewsApi.create(reviewBooking._id, rating, feedback);
      setReviewBooking(null);
      setFeedback('');
      setRating(5);
      await fetchBookings(); // Refresh to show review was submitted
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime) > now);
  const past = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || (b.status === 'CONFIRMED' && new Date(b.startTime) <= now));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past & Cancelled (${past.length})`]].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>}

      {!loading && (
        <div className="space-y-4">
          {activeTab === 'upcoming' && (
            upcoming.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No upcoming sessions. <a href="/mentors" className="text-blue-600 hover:underline">Find a mentor</a>!</p>
            ) : (
              upcoming.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  role="student"
                  onCancel={handleCancel}
                  onReview={setReviewBooking}
                />
              ))
            )
          )}
          {activeTab === 'past' && (
            past.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No past or cancelled sessions.</p>
            ) : (
              past.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  role="student"
                  onCancel={handleCancel}
                  onReview={setReviewBooking}
                />
              ))
            )
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h2>
            <p className="text-sm text-gray-500 mb-4">Session with {reviewBooking.mentor?.name}</p>

            {/* Star rating selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl focus:outline-none">
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>

            {reviewError && <p className="text-red-600 text-sm mb-3">{reviewError}</p>}

            <div className="flex space-x-3">
              <button onClick={handleReviewSubmit} disabled={reviewLoading} className="btn-primary flex-1">
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
              <button onClick={() => { setReviewBooking(null); setReviewError(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
