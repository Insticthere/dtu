/**
 * components/SlotPicker.jsx — Time slot grid with Vercel styling + dark mode
 */
import React, { useState } from 'react';
import { formatDate, formatTime } from '../utils/format.js';

const SlotPicker = ({ slots, onBook, loading }) => {
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 text-sm">No available slots in the next 10 days.</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Check back later or contact the mentor.</p>
      </div>
    );
  }

  // Group by date string
  const grouped = slots.reduce((acc, slot) => {
    const key = new Date(slot.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
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
    <div className="space-y-6">
      {Object.entries(grouped).map(([, daySlots]) => (
        <div key={daySlots[0].date}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            {formatDate(daySlots[0].date)}
          </p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const isSelected = selected?._id === slot._id;
              return (
                <button
                  key={slot._id}
                  onClick={() => setSelected(isSelected ? null : slot)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 ${
                    isSelected
                      ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:border-gray-600'
                  }`}
                >
                  {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirmation panel */}
      {selected && (
        <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 animate-fade-in">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(selected.date)} · {formatTime(selected.startTime)}–{formatTime(selected.endTime)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">All times UTC</p>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleConfirm} disabled={confirming || loading} className="btn-primary text-xs px-4 py-2">
              {confirming ? 'Confirming…' : 'Confirm Booking'}
            </button>
            <button onClick={() => setSelected(null)} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
