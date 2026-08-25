/**
 * pages/MentorAvailability.jsx — Vercel-style availability management
 */
import React, { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '../api/availability.js';
import { Alert } from '../components/ui/index.js';
import { DAY_NAMES } from '../utils/constants.js';

const DEFAULT = { dayOfWeek: '1', startTime: '09:00', endTime: '11:00' };

const MentorAvailability = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await availabilityApi.list();
      setRules(d.availability || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openAdd = () => { setEditingId(null); setForm(DEFAULT); setError(''); setSuccess(''); setShowForm(true); };
  const openEdit = (r) => { setEditingId(r._id); setForm({ dayOfWeek: String(r.dayOfWeek), startTime: r.startTime, endTime: r.endTime }); setError(''); setSuccess(''); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(DEFAULT); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = { ...form, dayOfWeek: Number(form.dayOfWeek) };
      const res = editingId ? await availabilityApi.update(editingId, payload) : await availabilityApi.create(payload);
      setSuccess(res.message);
      closeForm();
      await fetchRules();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule? Future unbooked slots will be removed.')) return;
    setError(''); setSuccess('');
    try { const res = await availabilityApi.remove(id); setSuccess(res.message); await fetchRules(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Availability</h1>
          <p className="page-subtitle">Configure your weekly schedule</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary text-sm">+ Add Rule</button>
        )}
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* Form */}
      {showForm && (
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Rule' : 'New Availability Rule'}
            </h2>
            <button onClick={closeForm} className="btn-ghost p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Day of Week</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))} className="input-field">
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Time (UTC)</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Time (UTC)</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="input-field" required />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              The time window must fit at least one session slot of your configured duration.
            </p>
            <div className="flex space-x-2">
              <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting ? 'Saving…' : editingId ? 'Update Rule' : 'Create Rule'}</button>
              <button type="button" onClick={closeForm} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">No availability rules yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Add a rule to start accepting bookings.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r._id} className={`card flex items-center justify-between ${!r.isActive ? 'opacity-40' : ''}`}>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {DAY_NAMES[r.dayOfWeek]}
                  <span className="text-gray-400 dark:text-gray-500 font-normal"> · {r.startTime}–{r.endTime} UTC</span>
                </p>
                {!r.isActive && <span className="text-xs text-gray-400">Deactivated</span>}
              </div>
              {r.isActive && (
                <div className="flex space-x-2">
                  <button onClick={() => openEdit(r)} className="btn-ghost text-xs px-3 py-1.5">Edit</button>
                  <button onClick={() => handleDelete(r._id)} className="btn-danger text-xs px-3 py-1.5">Delete</button>
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
