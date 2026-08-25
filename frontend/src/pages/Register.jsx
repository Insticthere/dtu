/**
 * pages/Register.jsx — Vercel-style clean minimalist registration page
 * Clean dark/light mode aesthetics, role switcher, and mentor application fields.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../utils/constants.js';
import { Alert } from '../components/ui/index.js';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    professionalTitle: '',
    expertise: '',
    yearsOfExperience: '',
    bio: '',
    profileUrl: '',
    preferredSessionDuration: '60',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
      };

      if (role === 'mentor') {
        Object.assign(payload, {
          professionalTitle: formData.professionalTitle,
          expertise: formData.expertise,
          yearsOfExperience: Number(formData.yearsOfExperience),
          bio: formData.bio,
          profileUrl: formData.profileUrl,
          preferredSessionDuration: Number(formData.preferredSessionDuration),
        });
      }

      const data = await authApi.register(payload);
      login(data.token, data.user);
      navigate(ROLE_HOME[data.user.role] || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 py-10 bg-white dark:bg-black transition-colors duration-200">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black items-center justify-center font-bold text-xl mb-4 shadow-sm">
            M
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join MentorConnect as a student or apply as a mentor
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm">
          {/* Role Toggle */}
          <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
            {[
              { id: 'student', label: '🎓 Student Account' },
              { id: 'mentor', label: '🏆 Become a Mentor' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 ${
                  role === r.id
                    ? 'bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Alex Morgan"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="alex@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {/* Mentor-only fields */}
            {role === 'mentor' && (
              <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-5 mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Mentor Application Profile
                  </p>
                  <span className="badge-pending">Pending Review</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Professional Title
                  </label>
                  <input
                    name="professionalTitle"
                    value={formData.professionalTitle}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Senior Software Engineer @ Google"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Areas of Expertise (comma-separated)
                  </label>
                  <input
                    name="expertise"
                    value={formData.expertise}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="React, Node.js, System Design, DSA"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="5"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                      Session Duration
                    </label>
                    <select
                      name="preferredSessionDuration"
                      value={formData.preferredSessionDuration}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Bio / Introduction
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="input-field min-h-[80px]"
                    placeholder="Tell students about your mentorship background, topics you cover, and interview experience..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Profile / LinkedIn URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="profileUrl"
                    value={formData.profileUrl}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 font-medium"
            >
              {loading
                ? 'Submitting…'
                : role === 'mentor'
                ? 'Submit Mentor Application'
                : 'Create Student Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800/80 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-gray-900 dark:text-white hover:underline underline-offset-4"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
