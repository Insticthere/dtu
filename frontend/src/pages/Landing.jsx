/**
 * pages/Landing.jsx — Public landing page
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Connect with Expert<br />
          <span className="text-yellow-300">Mentors</span>
        </h1>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Book 1:1 sessions with industry professionals. Grow your skills, crack interviews, and accelerate your career.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'mentor' ? '/mentor/dashboard' : '/dashboard'}
              className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors">
                Get Started Free
              </Link>
              <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔍', title: 'Discover Mentors', desc: 'Browse approved mentors filtered by expertise, experience, and ratings.' },
              { icon: '📅', title: 'Book a Session', desc: 'Pick an available time slot that works for you. Get instant confirmation.' },
              { icon: '⭐', title: 'Grow & Review', desc: 'Attend your session, learn from the best, and leave a review.' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
