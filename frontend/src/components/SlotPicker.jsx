/**
 * components/SlotPicker.jsx — Grid of available time slots for booking
 *
 * Shows future AVAILABLE slots grouped by date.
 * The student clicks a slot to select it, then confirms booking.
 */
import React, { useState } from 'react';

/** Format a Date to a readable date string */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
};

/** Format a Date to HH:MM time string */
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  });
};

const SlotPicker = ({ slots, onBook, loading }) => {
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-lg">No available slots in the next 10 days.</p>
        <p className="text-sm mt-1">Check back later or contact the mentor directly.</p>
      </div>
    );
  }

  // Group slots by date string for display
  const grouped = slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await onBook(selected._id);
      setSelected(null);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {Object.entries(grouped).map(([dateKey, daySlots]) => (
          <div key={dateKey}>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              {formatDate(daySlots[0].date)}
            </h4>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => (
                <button
                  key={slot._id}
                  onClick={() => setSelected(slot._id === selected?._id ? null : slot)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    selected?._id === slot._id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Booking confirmation panel */}
      {selected && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">
            Selected: {formatDate(selected.date)} at {formatTime(selected.startTime)} – {formatTime(selected.endTime)}
          </p>
          <p className="text-xs text-blue-600 mt-1">All times are in UTC</p>
          <div className="flex space-x-3 mt-3">
            <button
              onClick={handleConfirm}
              disabled={confirming || loading}
              className="btn-primary text-sm"
            >
              {confirming ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button onClick={() => setSelected(null)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
