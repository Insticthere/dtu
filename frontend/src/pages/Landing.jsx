/**
 * pages/Landing.jsx — Vercel-style landing page with dark mode
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../utils/constants.js';

const Feature = ({ icon, title, desc }) => (
  <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
    <div className="text-2xl mb-3">{icon}</div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
          Now live — find your mentor today
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight mb-6">
          Book sessions with<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">
            expert mentors
          </span>
        </h1>

        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Connect 1:1 with industry professionals. Ace interviews, learn new skills, and accelerate your career — one session at a time.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {user ? (
            <Link to={ROLE_HOME[user.role] || '/dashboard'} className="btn-primary px-6 py-2.5 text-sm">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary px-6 py-2.5 text-sm">
                Get started free →
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-2.5 text-sm">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-900" />

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-8">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature icon="🔍" title="Discover mentors" desc="Browse our curated directory of approved professionals filtered by expertise, experience, and rating." />
          <Feature icon="📅" title="Book a slot" desc="Pick any available time slot. Get instant confirmation. All sessions are tracked end-to-end." />
          <Feature icon="⭐" title="Grow & review" desc="Attend your session, learn from the best, and leave a star rating to help others." />
        </div>
      </section>


      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-600">© 2026 MentorConnect. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;
