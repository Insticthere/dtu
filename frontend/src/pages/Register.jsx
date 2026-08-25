/**
 * pages/Register.jsx — Registration page for students and mentors
 *
 * Role toggle: clicking "Student" or "Mentor" reveals/hides the mentor-specific
 * application fields. This keeps the form clean for students and avoids a
 * separate page for mentor registration.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../utils/constants.js';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    professionalTitle: '', expertise: '', yearsOfExperience: '',
    bio: '', profileUrl: '', preferredSessionDuration: '60',
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
          expertise: formData.expertise, // Sent as comma-separated string, backend splits it
          yearsOfExperience: formData.yearsOfExperience,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">MentorConnect</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
          {['student', 'mentor'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                role === r ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'student' ? '🎓 Student' : '🏆 Mentor'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Your name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="8+ characters" minLength={6} required />
            </div>
          </div>

          {/* Mentor-only fields */}
          {role === 'mentor' && (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-600">Mentor Application Details</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                <input name="professionalTitle" value={formData.professionalTitle} onChange={handleChange} className="input-field" placeholder="e.g. Senior SWE at Google" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas of Expertise <span className="text-gray-400">(comma-separated)</span></label>
                <input name="expertise" value={formData.expertise} onChange={handleChange} className="input-field" placeholder="e.g. DSA, System Design, React" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} className="input-field" placeholder="e.g. 5" min="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
                  <select name="preferredSessionDuration" value={formData.preferredSessionDuration} onChange={handleChange} className="input-field" required>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} className="input-field resize-none" rows={3} placeholder="Tell students about your background..." required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn / Portfolio URL <span className="text-gray-400">(optional)</span></label>
                <input type="url" name="profileUrl" value={formData.profileUrl} onChange={handleChange} className="input-field" placeholder="https://linkedin.com/in/you" />
              </div>
            </div>
          )}

          {role === 'mentor' && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-700">
              ℹ️ Mentor applications are reviewed by an admin. You'll be able to configure availability once approved.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : role === 'mentor' ? 'Submit Application' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
