import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Scale, Plus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function AddInstrumentPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    categoryId: '',
    make: '',
    model: '',
    serialNumber: '',
    premisesName: '',
    address: '',
    district: 'Central Delhi',
    state: 'Delhi',
    pinCode: '',
    specs: {}
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
      if (res.data.categories && res.data.categories.length > 0) {
        handleCategoryChange(res.data.categories[0]._id, res.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (catId, catList = categories) => {
    const cat = catList.find(c => c._id === catId);
    setSelectedCategory(cat);
    
    // Initialize default specs based on category specSchema
    const initialSpecs = {};
    if (cat && cat.specSchema) {
      cat.specSchema.forEach(s => {
        initialSpecs[s.id] = s.default !== undefined ? s.default : '';
      });
    }

    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      specs: initialSpecs
    }));
  };

  const handleSpecChange = (specId, val) => {
    setFormData(prev => ({
      ...prev,
      specs: {
        ...prev.specs,
        [specId]: val
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        categoryId: formData.categoryId,
        make: formData.make,
        model: formData.model,
        serialNumber: formData.serialNumber,
        specs: formData.specs,
        location: {
          premisesName: formData.premisesName,
          address: formData.address,
          district: formData.district,
          state: formData.state,
          pinCode: formData.pinCode
        }
      };

      await api.post('/instruments', payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register instrument.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading instrument categories...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-900">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Register New Measuring Instrument</h1>
              <p className="text-xs text-slate-300">Add instrument technical parameters and location for statutory verification</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {/* Section 1: Category Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              1. Instrument Classification
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Validity: {c.verificationValidityMonths} Months)
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedCategory.description} • Standard: {selectedCategory.applicableStandard}
              </p>
            )}
          </div>

          {/* Section 2: Core Equipment Identifiers */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              2. Manufacturer & Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Make / Manufacturer *
                </label>
                <input
                  type="text"
                  required
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g. Essae-Teraoka / Dräger"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Designation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. DS-215 / Alcotest 7510"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number (Stamping Plaque) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g. ESS-2026-9912"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Category Specifications */}
          {selectedCategory && selectedCategory.specSchema && selectedCategory.specSchema.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>3. Dynamic Technical Specifications ({selectedCategory.name})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {selectedCategory.specSchema.map((s) => (
                  <div key={s.id}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {s.label} {s.unit ? `(${s.unit})` : ''} {s.required && '*'}
                    </label>

                    {s.type === 'select' ? (
                      <select
                        value={formData.specs[s.id] || ''}
                        onChange={(e) => handleSpecChange(s.id, e.target.value)}
                        className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {(s.options || []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={s.type === 'number' ? 'number' : 'text'}
                        value={formData.specs[s.id] || ''}
                        onChange={(e) => handleSpecChange(s.id, s.type === 'number' ? Number(e.target.value) : e.target.value)}
                        required={s.required}
                        className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Installation Location */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              4. Installation Location & Premises
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premises / Counter Name
                </label>
                <input
                  type="text"
                  value={formData.premisesName}
                  onChange={(e) => setFormData({ ...formData, premisesName: e.target.value })}
                  placeholder="e.g. Counter 1, Weighbridge Bay 2"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Shop No., Market, Road"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="e.g. Central Delhi"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State & PIN Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Register Instrument'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
