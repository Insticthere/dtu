/**
 * pages/MentorProfile.jsx — Vercel-style individual mentor page
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mentorsApi } from '../api/mentors.js';
import { bookingsApi } from '../api/bookings.js';
import SlotPicker from '../components/SlotPicker.jsx';

const Tab = ({ id, label, active, count, onClick }) => (
  <button onClick={() => onClick(id)}
    className={`px-1 pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
      active ? 'tab-active' : 'tab-inactive'
    }`}>
    {label} {count !== undefined && <span className="ml-1 text-xs opacity-50">{count}</span>}
  </button>
);

const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingMsg, setBookingMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('slots');

  useEffect(() => {
    Promise.all([mentorsApi.getById(id), mentorsApi.getSlots(id), mentorsApi.getReviews(id)])
      .then(([m, s, r]) => { setMentor(m.mentor); setSlots(s.slots || []); setReviews(r.reviews || []); })
      .catch(() => navigate('/mentors'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleBook = async (slotId) => {
    setBookingMsg({ type: '', text: '' });
    try {
      await bookingsApi.create(id, slotId);
      setBookingMsg({ type: 'success', text: 'Booking confirmed! Check My Bookings for details.' });
      setSlots((p) => p.filter((s) => s._id !== slotId));
    } catch (err) {
      setBookingMsg({ type: 'error', text: err.message });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="spinner" />
    </div>
  );
  if (!mentor) return null;

  const { user, professionalTitle, expertise, yearsOfExperience, bio, profileUrl, averageRating, totalReviews, preferredSessionDuration } = mentor;

  return (
    <div className="page-container max-w-3xl">
      {/* Profile card */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          {/* Large avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-white dark:text-black">{user?.name?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
              {totalReviews > 0 && (
                <span className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                  ★ {averageRating.toFixed(1)}
                  <span className="text-gray-400 dark:text-gray-600 text-xs font-normal">({totalReviews})</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{professionalTitle}</p>
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white mt-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {expertise.map((t) => <span key={t} className="tag">{t}</span>)}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{yearsOfExperience}y experience</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span>{preferredSessionDuration} min sessions</span>
        </div>

        <div className="divider mt-4 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{bio}</p>
      </div>

      {/* Booking alerts */}
      {bookingMsg.text && (
        <div className={`mb-4 ${bookingMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {bookingMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <Tab id="slots" label="Available Slots" count={slots.length} active={activeTab === 'slots'} onClick={setActiveTab} />
        <Tab id="reviews" label="Reviews" count={reviews.length} active={activeTab === 'reviews'} onClick={setActiveTab} />
      </div>

      {activeTab === 'slots' && <SlotPicker slots={slots} onBook={handleBook} />}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-12">No reviews yet.</p>
          ) : reviews.map((r) => (
            <div key={r._id} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{r.student?.name}</span>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={`text-sm ${s <= r.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-800'}`}>★</span>
                  ))}
                </div>
              </div>
              {r.feedback && <p className="text-sm text-gray-600 dark:text-gray-400">{r.feedback}</p>}
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">{new Date(r.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorProfile;
