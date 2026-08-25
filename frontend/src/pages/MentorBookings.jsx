/**
 * pages/MentorBookings.jsx — Mentor's incoming bookings view
 */
import React, { useState, useEffect, useCallback } from 'react';
import { bookingsApi } from '../api/bookings.js';
import BookingCard from '../components/BookingCard.jsx';

const MentorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingsApi.getMentorBookings();
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
      await fetchBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' && new Date(b.startTime) > now);
  const past = bookings.filter((b) => b.status !== 'CONFIRMED' || new Date(b.startTime) <= now);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Student Bookings</h1>

      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past & Other (${past.length})`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>}

      {!loading && (
        <div className="space-y-4">
          {(activeTab === 'upcoming' ? upcoming : past).length === 0 ? (
            <p className="text-center text-gray-500 py-10">No bookings here yet.</p>
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
