import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import DynamicSchemaBuilder from '../components/DynamicSchemaBuilder';
import {
  Layers,
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // New Category State
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [description, setDescription] = useState('');
  const [validityMonths, setValidityMonths] = useState(12);
  const [applicableStandard, setApplicableStandard] = useState('Legal Metrology (General) Rules, 2011');
  const [inspectionSchema, setInspectionSchema] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/categories', {
        name: categoryName,
        code: categoryCode,
        description,
        verificationValidityMonths: Number(validityMonths),
        applicableStandard,
        inspectionSchema,
      });

      setModalOpen(false);
      setCategoryName('');
      setCategoryCode('');
      setDescription('');
      setInspectionSchema([]);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create instrument category.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading instrument categories...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-1">
            <ArrowLeft className="w-4 h-4" /> Back to Admin Console
          </Link>
          <h1 className="text-2xl font-black text-slate-900">
            Instrument Categories & Dynamic Inspection Schemas
          </h1>
          <p className="text-xs text-slate-500">
            Define new instrument types and custom statutory inspection checkpoints with zero code modifications
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Category
        </button>
      </div>

      {/* Category List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {cat.code}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Valid for {cat.verificationValidityMonths} Months
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">{cat.name}</h2>
              <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
              
              <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong>Applicable Standard:</strong> {cat.applicableStandard}
              </div>

              {/* Inspection Checkpoints Summary */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Inspection Checkpoints ({cat.inspectionSchema?.length || 0})</span>
                </h3>
                <ul className="space-y-1 text-xs text-slate-600 max-h-40 overflow-y-auto pr-1">
                  {(cat.inspectionSchema || []).map((cp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 py-1 border-b border-slate-100 last:border-0">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800">{cp.label}</span>
                        {cp.unit && <span className="text-slate-400 text-[10px] ml-1">({cp.unit})</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Instrument Category</h3>
                <p className="text-xs text-slate-500">Configure technical specification parameters and dynamic inspection schema</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            {error && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Laser Speed Gun / Moisture Meter"
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Code (Short Identifier)
                  </label>
                  <input
                    type="text"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SPEED_GUN"
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statutory Verification Validity (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={validityMonths}
                    onChange={(e) => setValidityMonths(e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applicable Legal Standard
                  </label>
                  <input
                    type="text"
                    value={applicableStandard}
                    onChange={(e) => setApplicableStandard(e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe instrument use case in trade, traffic safety, or medical testing"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Dynamic Schema Builder Section */}
              <div className="pt-4 border-t border-slate-200">
                <DynamicSchemaBuilder
                  schema={inspectionSchema}
                  onChange={(updated) => setInspectionSchema(updated)}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving Category...' : 'Save & Publish Category'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
