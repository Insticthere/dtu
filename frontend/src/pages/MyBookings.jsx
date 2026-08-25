/**
 * pages/MyBookings.jsx — Student bookings with Vercel style + dark mode
 */
import React, { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/bookings.js';
import { reviewsApi } from '../api/reviews.js';
import BookingCard from '../components/BookingCard.jsx';
import { Alert } from '../components/ui/index.js';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Review modal
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await bookingsApi.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    try { await bookingsApi.cancel(id); await fetchBookings(); }
    catch (err) { setError(err.message); }
  };

  const handleReviewSubmit = async () => {
    if (!reviewBooking) return;
    setReviewLoading(true); setReviewError('');
    try {
      await reviewsApi.create(reviewBooking._id, rating, feedback);
      setReviewBooking(null); setFeedback(''); setRating(5);
      await fetchBookings();
    } catch (err) { setReviewError(err.message); }
    finally { setReviewLoading(false); }
  };

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime) > now);
  const past = bookings.filter((b) => b.status !== 'CONFIRMED' || new Date(b.startTime) <= now);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">Manage your sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        {[['upcoming', 'Upcoming', upcoming.length], ['past', 'Past & Cancelled', past.length]].map(([tab, label, count]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? 'tab-active' : 'tab-inactive'}`}>
            {label} <span className="ml-1 text-xs opacity-50">{count}</span>
          </button>
        ))}
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {loading && <div className="flex justify-center py-16"><div className="spinner" /></div>}

      {!loading && (
        <div className="space-y-3">
          {(activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'upcoming' ? 'No upcoming sessions.' : 'No past sessions.'}
              </p>
              {activeTab === 'upcoming' && (
                <a href="/mentors" className="text-xs text-gray-900 dark:text-white font-medium hover:underline mt-2 inline-block">
                  Find a mentor →
                </a>
              )}
            </div>
          ) : (
            (activeTab === 'upcoming' ? upcoming : past).map((b) => (
              <BookingCard key={b._id} booking={b} role="student" onCancel={handleCancel} onReview={setReviewBooking} />
            ))
          )}
        </div>
      )}

      {/* Review modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Leave a review</h2>
              <button onClick={() => { setReviewBooking(null); setReviewError(''); }}
                className="btn-ghost p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Session with <span className="font-medium text-gray-900 dark:text-white">{reviewBooking.mentor?.name}</span>
            </p>

            {/* Star rating */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
              <div className="flex space-x-1">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-800'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Feedback (optional)</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                className="input-field resize-none" rows={3} placeholder="Share your experience…" />
            </div>

            {reviewError && <Alert type="error">{reviewError}</Alert>}

            <div className="flex space-x-2">
              <button onClick={handleReviewSubmit} disabled={reviewLoading} className="btn-primary flex-1 py-2.5">
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>
              <button onClick={() => { setReviewBooking(null); setReviewError(''); }} className="btn-secondary flex-1 py-2.5">
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
