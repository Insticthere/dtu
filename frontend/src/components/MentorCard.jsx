/**
 * components/MentorCard.jsx — Card for displaying a mentor in the directory
 */
import React from 'react';
import { Link } from 'react-router-dom';

const MentorCard = ({ mentor }) => {
  const { user, professionalTitle, expertise, yearsOfExperience, averageRating, totalReviews, preferredSessionDuration } = mentor;

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{professionalTitle}</p>
        </div>
        {/* Rating */}
        <div className="text-right">
          {totalReviews > 0 ? (
            <>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="font-semibold text-gray-800">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-400">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
            </>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>

      {/* Expertise tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {expertise.slice(0, 4).map((tag) => (
          <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
            {tag}
          </span>
        ))}
        {expertise.length > 4 && (
          <span className="text-xs text-gray-400">+{expertise.length - 4} more</span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
        <span>📅 {yearsOfExperience} yr{yearsOfExperience !== 1 ? 's' : ''} experience</span>
        <span>⏱ {preferredSessionDuration} min sessions</span>
      </div>

      {/* CTA */}
      <div className="mt-4">
        <Link to={`/mentors/${user?._id}`} className="btn-primary text-sm w-full text-center block">
          View Profile & Book
        </Link>
      </div>
    </div>
  );
};

export default MentorCard;
