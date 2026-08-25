/**
 * @file format.js
 * Contains shared date and time formatting utilities.
 */

/**
 * Formats a date object to "Monday, 31 Aug" style.
 * Used primarily for slot groupings.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  // Convert to Date if string
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });
};

/**
 * Formats a date object to "09:00" UTC time.
 * Used for slot buttons.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  const d = new Date(date);
  // Use UTC hours to avoid timezone shift in display if slots are absolute
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
};

/**
 * Formats a date to "Mon, 31 Aug, 09:00" style.
 * Used for booking cards.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  return `${dateStr}, ${timeStr}`;
};

/**
 * Formats a date to "31/08/2026" short format.
 * Used for review timestamps.
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted short date string
 */
export const formatShortDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB'); // gets DD/MM/YYYY
};
