/**
 * pages/MentorBookings.jsx — Mentor's incoming bookings (Vercel style)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/bookings.js';
import BookingCard from '../components/BookingCard.jsx';
import { Alert } from '../components/ui/index.js';

const MentorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchBookings = useCallback(async () => {
    setLoading(true); setError('');
    try { const d = await bookingsApi.getMentorBookings(); setBookings(d.bookings || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    try { await bookingsApi.cancel(id); await fetchBookings(); }
    catch (e) { setError(e.message); }
  };

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime) > now);
  const past = bookings.filter((b) => b.status !== 'CONFIRMED' || new Date(b.startTime) <= now);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Student Bookings</h1>
        <p className="page-subtitle">Manage your incoming sessions</p>
      </div>

      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        {[['upcoming', 'Upcoming', upcoming.length], ['past', 'Past & Other', past.length]].map(([tab, label, count]) => (
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
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-16">No bookings here yet.</p>
          ) : (
            (activeTab === 'upcoming' ? upcoming : past).map((b) => (
              <BookingCard key={b._id} booking={b} role="mentor" onCancel={handleCancel} onReview={() => {}} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MentorBookings;
