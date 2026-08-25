/**
 * components/BookingCard.jsx — Vercel-style booking card with dark mode
 */
import React, { useState } from 'react';
import { STATUS_BADGE_CLASS } from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';

const BookingCard = ({ booking, role, onCancel, onReview }) => {
  const [cancelling, setCancelling] = useState(false);

  const isFuture = new Date(booking.startTime) > new Date();
  const canCancel = booking.status === 'CONFIRMED' && isFuture;
  const canReview = role === 'student' && booking.status === 'COMPLETED' && !booking.hasReview;

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? The slot will become available again.')) return;
    setCancelling(true);
    try { await onCancel(booking._id); }
    finally { setCancelling(false); }
  };

  const otherParty = role === 'student' ? booking.mentor?.name : booking.student?.name;
  const otherLabel = role === 'student' ? 'Mentor' : 'Student';

  return (
    <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start space-x-4 min-w-0">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            {otherParty?.charAt(0) || '?'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{otherParty}</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">{otherLabel}</span>
            <span className={STATUS_BADGE_CLASS[booking.status]}>{booking.status}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)} UTC
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 shrink-0">
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling} className="btn-danger text-xs px-3 py-1.5">
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
        {canReview && (
          <button onClick={() => onReview(booking)} className="btn-primary text-xs px-3 py-1.5">
            Leave Review
          </button>
        )}
        {booking.status === 'CANCELLED' && (
          <span className="text-xs text-gray-400 dark:text-gray-600">
            Cancelled {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleDateString('en-GB') : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
