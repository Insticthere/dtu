/**
 * components/BookingCard.jsx — Displays a single booking for student or mentor
 *
 * Props:
 *   booking  — booking object (with populated slot, mentor, student)
 *   role     — 'student' or 'mentor' (determines which side to show)
 *   onCancel — callback to cancel the booking
 *   onReview — callback to leave a review (student only, COMPLETED bookings)
 */
import React, { useState } from 'react';

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  });
};

// Map booking status to Tailwind badge class
const STATUS_BADGE = {
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
};

const BookingCard = ({ booking, role, onCancel, onReview }) => {
  const [cancelling, setCancelling] = useState(false);

  const isFuture = new Date(booking.startTime) > new Date();
  const canCancel = booking.status === 'CONFIRMED' && isFuture;
  const canReview = role === 'student' && booking.status === 'COMPLETED' && !booking.hasReview;

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await onCancel(booking._id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="card border-l-4 border-l-blue-400">
      <div className="flex items-start justify-between">
        <div>
          {/* Show the other party's name depending on role */}
          <p className="font-semibold text-gray-900">
            {role === 'student' ? `Mentor: ${booking.mentor?.name || 'Unknown'}` : `Student: ${booking.student?.name || 'Unknown'}`}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)} (UTC)
          </p>
        </div>
        <span className={STATUS_BADGE[booking.status] || 'badge-pending'}>
          {booking.status}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex space-x-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger text-sm"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
        {canReview && (
          <button
            onClick={() => onReview(booking)}
            className="btn-primary text-sm"
          >
            Leave Review
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
