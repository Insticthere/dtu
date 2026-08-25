/**
 * pages/MentorDirectory.jsx — Vercel-style mentor directory
 */
import React, { useState, useEffect, useCallback } from 'react';
import { mentorsApi } from '../api/mentors.js';
import MentorCard from '../components/MentorCard.jsx';
import { Alert, Icon } from '../components/ui/index.js';

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

  useEffect(() => {
    const t = setTimeout(fetchMentors, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchMentors, search]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Find a Mentor</h1>
        <p className="page-subtitle">Browse our verified, approved mentors</p>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" size={18} className="text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or title…" className="input-field pl-9" />
        </div>
        <input type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)}
          placeholder="Filter by skill (e.g. React)…" className="input-field max-w-xs" />
        {(search || expertise) && (
          <button onClick={() => { setSearch(''); setExpertise(''); }} className="btn-ghost text-xs">
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-24"><div className="spinner" /></div>
      )}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && mentors.length === 0 && (
        <div className="text-center py-24">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No mentors found.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Try adjusting your filters.</p>
        </div>
      )}

      {!loading && !error && mentors.length > 0 && (
        <>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} available
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((m) => <MentorCard key={m._id} mentor={m} />)}
          </div>
        </>
      )}
    </div>
  );
};

export default MentorDirectory;
