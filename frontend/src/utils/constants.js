/**
 * @file constants.js
 * Contains shared constants across the application.
 */

/* === ROUTING === */
export const ROLE_HOME = { student: '/dashboard', mentor: '/mentor/dashboard', admin: '/admin/dashboard' };

/* === DATE & TIME === */
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* === UI CLASSES === */
export const STATUS_BADGE_CLASS = { 
  PENDING: 'badge-pending', 
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
  CONFIRMED: 'badge-confirmed',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled'
};

/* === DEMO DATA === */
export const DEMO_CREDENTIALS = [
  { label: 'Admin', email: 'admin@demo.com', pass: 'Demo@123456' },
  { label: 'Mentor', email: 'priya.mentor@demo.com', pass: 'Demo@123456' },
  { label: 'Student', email: 'student@demo.com', pass: 'Demo@123456' }
];
