import { Icon } from '../components/ui/index.js';
/**
 * pages/StudentDashboard.jsx — Vercel-style student home
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const QuickLink = ({ to, icon, title, desc }) => (
  <Link to={to} className="card group hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm block">
    <div className="flex items-start justify-between mb-4">
      <span className="text-2xl">{icon}</span>
      <Icon name="arrow-up-right" size={16} />
    </div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
  </Link>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <div className="mb-10">
        <h1 className="page-title">Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">What would you like to do today?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink to="/mentors" icon="🔍" title="Find Mentors" desc="Browse our directory of approved mentors" />
        <QuickLink to="/my-bookings" icon="📅" title="My Bookings" desc="View upcoming and past sessions" />
        <QuickLink to="/my-bookings" icon="⭐" title="Leave a Review" desc="Rate your completed sessions" />
      </div>
    </div>
  );
};

export default StudentDashboard;
