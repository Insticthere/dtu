/**
 * pages/MentorAvailability.jsx — Mentor's availability rule management
 * Add, edit, and delete weekly availability rules.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '../api/availability.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_FORM = { dayOfWeek: '1', startTime: '09:00', endTime: '11:00' };

const MentorAvailability = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await availabilityApi.list();
      setRules(data.availability || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        const res = await availabilityApi.update(editingId, { ...form, dayOfWeek: Number(form.dayOfWeek) });
        setSuccess(res.message);
      } else {
        const res = await availabilityApi.create({ ...form, dayOfWeek: Number(form.dayOfWeek) });
        setSuccess(res.message);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      await fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule._id);
    setForm({ dayOfWeek: String(rule.dayOfWeek), startTime: rule.startTime, endTime: rule.endTime });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability rule? Future unbooked slots will be removed. Existing bookings will not be affected.')) return;
    setError('');
    try {
      const res = await availabilityApi.remove(id);
      setSuccess(res.message);
      await fetchRules();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(DEFAULT_FORM); setError(''); }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editingId ? 'Edit Rule' : 'New Availability Rule'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                className="input-field"
              >
                {DAY_NAMES.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (UTC)</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time (UTC)</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="input-field" required />
              </div>
            </div>
            <p className="text-xs text-gray-400">All times are in UTC. The gap must fit at least one session of your duration.</p>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingId ? 'Update Rule' : 'Create Rule'}
            </button>
          </form>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : rules.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No availability rules yet.</p>
          <p className="text-sm mt-1">Add a rule to start accepting bookings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule._id} className={`card flex items-center justify-between ${!rule.isActive ? 'opacity-50' : ''}`}>
              <div>
                <p className="font-semibold text-gray-800">
                  {DAY_NAMES[rule.dayOfWeek]} · {rule.startTime} – {rule.endTime} UTC
                </p>
                {!rule.isActive && <span className="text-xs text-gray-400">Deactivated</span>}
              </div>
              {rule.isActive && (
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(rule)} className="btn-secondary text-sm">Edit</button>
                  <button onClick={() => handleDelete(rule._id)} className="btn-danger text-sm">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorAvailability;
