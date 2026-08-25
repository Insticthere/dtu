/**
 * pages/MentorDirectory.jsx — Browse all approved mentors
 * Supports search by name/title and filter by expertise tag.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { mentorsApi } from '../api/mentors.js';
import MentorCard from '../components/MentorCard.jsx';

const MentorDirectory = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expertise, setExpertise] = useState('');

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (expertise.trim()) params.expertise = expertise.trim();
      const data = await mentorsApi.list(params);
      setMentors(data.mentors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, expertise]);

  // Fetch on mount and when filters change (with 300ms debounce for search)
  useEffect(() => {
    const timer = setTimeout(fetchMentors, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchMentors, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find a Mentor</h1>
        <p className="text-gray-500 mt-1">Browse and connect with our approved mentors</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or title..."
          className="input-field max-w-sm"
        />
        <input
          type="text"
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="Filter by expertise (e.g. React)..."
          className="input-field max-w-sm"
        />
        {(search || expertise) && (
          <button
            onClick={() => { setSearch(''); setExpertise(''); }}
            className="btn-secondary text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {!loading && !error && mentors.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl">No mentors found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && mentors.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">{mentors.length} mentor{mentors.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard key={mentor._id} mentor={mentor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MentorDirectory;
