import { Icon } from '../components/ui/index.js';
/**
 * components/MentorCard.jsx — Vercel-style mentor card
 */
import React from 'react';
import { Link } from 'react-router-dom';

const StarIcon = ({ filled }) => (
  <Icon name="star" size={14} className="text-yellow-400" />
);

const MentorCard = ({ mentor }) => {
  const { user, professionalTitle, expertise, yearsOfExperience, averageRating, totalReviews, preferredSessionDuration } = mentor;

  return (
    <div className="card group hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {/* Avatar placeholder with initials */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-white dark:text-black">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{professionalTitle}</p>
          </div>
        </div>

        {/* Rating */}
        {totalReviews > 0 && (
          <div className="flex items-center space-x-1 shrink-0">
            <StarIcon filled />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">({totalReviews})</span>
          </div>
        )}
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {expertise.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
        {expertise.length > 3 && (
          <span className="tag text-gray-400 dark:text-gray-600">+{expertise.length - 3}</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-5 mt-auto">
        <span>{yearsOfExperience}y exp</span>
        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        <span>{preferredSessionDuration} min sessions</span>
        {totalReviews === 0 && <span className="text-gray-400 dark:text-gray-600">No reviews yet</span>}
      </div>

      {/* CTA */}
      <Link
        to={`/mentors/${user?._id}`}
        className="btn-primary w-full text-center text-xs py-2"
      >
        View Profile →
      </Link>
    </div>
  );
};

export default MentorCard;
