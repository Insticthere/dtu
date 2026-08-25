/**
 * pages/MentorProfile.jsx — Individual mentor profile page
 * Shows mentor details, available slots for booking, and reviews.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mentorsApi } from '../api/mentors.js';
import { bookingsApi } from '../api/bookings.js';
import SlotPicker from '../components/SlotPicker.jsx';

const MentorProfile = () => {
  const { id } = useParams(); // mentor's user ID
  const navigate = useNavigate();

  const [mentor, setMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'reviews'

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [mentorData, slotsData, reviewsData] = await Promise.all([
          mentorsApi.getById(id),
          mentorsApi.getSlots(id),
          mentorsApi.getReviews(id),
        ]);
        setMentor(mentorData.mentor);
        setSlots(slotsData.slots || []);
        setReviews(reviewsData.reviews || []);
      } catch (err) {
        // If mentor not found (404), redirect to directory
        navigate('/mentors');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, navigate]);

  const handleBook = async (slotId) => {
    setBookingError('');
    setBookingSuccess('');
    try {
      await bookingsApi.create(id, slotId);
      setBookingSuccess('🎉 Booking confirmed! Check My Bookings for details.');
      // Remove the booked slot from the list immediately (optimistic UI)
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
    } catch (err) {
      setBookingError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!mentor) return null;

  const { user, professionalTitle, expertise, yearsOfExperience, bio, profileUrl, averageRating, totalReviews, preferredSessionDuration } = mentor;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-500 mt-1">{professionalTitle}</p>
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                🔗 View Profile
              </a>
            )}
          </div>
          <div className="text-right">
            {totalReviews > 0 ? (
              <div>
                <div className="flex items-center justify-end space-x-1">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-400">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">No reviews yet</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {expertise.map((tag) => (
            <span key={tag} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div><span className="font-medium">Experience:</span> {yearsOfExperience} years</div>
          <div><span className="font-medium">Session:</span> {preferredSessionDuration} minutes</div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 leading-relaxed">{bio}</p>
        </div>
      </div>

      {/* Success/Error alerts for booking */}
      {bookingSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{bookingSuccess}</div>
      )}
      {bookingError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{bookingError}</div>
      )}

      {/* Tabs: Slots / Reviews */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {['slots', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'slots' ? `Available Slots (${slots.length})` : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'slots' && (
        <SlotPicker slots={slots} onBook={handleBook} />
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="card">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{review.student?.name || 'Anonymous'}</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                  </div>
                </div>
                {review.feedback && (
                  <p className="text-sm text-gray-600 mt-2">{review.feedback}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MentorProfile;
