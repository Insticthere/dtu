import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  Plus,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  Award,
  Receipt,
  MapPin,
  Cpu,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function AddInstrumentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [traders, setTraders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isOfficerOrAdmin = user && (user.role === 'admin' || user.role === 'lmo' || user.role === 'gatc');
  const [traderMode, setTraderMode] = useState('existing'); // 'existing' | 'new'

  const [formData, setFormData] = useState({
    // Ownership (for Officer/Admin)
    ownerId: '',
    newTrader: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      gstNumber: ''
    },

    // Classification & Standard
    categoryId: '',
    modelApprovalNumber: '',
    accuracyClass: 'Class III (Medium)',
    verificationType: 'initial_verification',

    // Equipment Identifiers
    make: '',
    model: '',
    serialNumber: '',
    manufacturerName: '',
    yearOfManufacture: new Date().getFullYear(),
    countryOfOrigin: 'India',

    // Metrological Scale Parameters
    maxCapacity: '',
    minCapacity: '',
    verificationIntervalE: '',
    actualIntervalD: '',

    // Dynamic Category Specs
    specs: {},

    // Statutory Stamping Fee / Challan
    feePaymentRef: {
      challanNumber: `BK/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`,
      amountPaid: 250,
      paymentStatus: 'Paid'
    },

    // Location & Premises
    premisesName: '',
    address: '',
    district: user?.jurisdictionDistrict || user?.orgDetails?.district || 'Central Delhi',
    state: 'Delhi',
    pinCode: ''
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      const [catRes, traderRes] = await Promise.all([
        api.get('/categories'),
        isOfficerOrAdmin ? api.get('/users/traders').catch(() => ({ data: { traders: [] } })) : Promise.resolve({ data: { traders: [] } })
      ]);

      const catList = catRes.data.categories || [];
      setCategories(catList);

      const traderList = traderRes.data?.traders || [];
      setTraders(traderList);

      if (catList.length > 0) {
        handleCategoryChange(catList[0]._id, catList);
      }

      if (traderList.length > 0) {
        setFormData(prev => ({ ...prev, ownerId: traderList[0]._id }));
      }
    } catch (err) {
      console.error('Failed to initialize instrument registration', err);
      setError('Unable to load registration parameters.');
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

    // Auto-fill suggested statutory model approval prefix based on category code
    const generatedModelApproval = cat ? `DLM/IND/APP/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}` : '';

    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      modelApprovalNumber: prev.modelApprovalNumber || generatedModelApproval,
      specs: initialSpecs,
      // Default fee suggestion based on category
      feePaymentRef: {
        ...prev.feePaymentRef,
        amountPaid: cat?.name?.toLowerCase().includes('weighbridge') ? 2000 : (cat?.name?.toLowerCase().includes('fuel') ? 1000 : 250)
      }
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
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const payload = {
        categoryId: formData.categoryId,
        make: formData.make,
        model: formData.model,
        serialNumber: formData.serialNumber,
        modelApprovalNumber: formData.modelApprovalNumber,
        accuracyClass: formData.accuracyClass,
        verificationType: formData.verificationType,
        maxCapacity: formData.maxCapacity || (formData.specs?.maxCapacityKg ? `${formData.specs.maxCapacityKg} kg` : undefined),
        minCapacity: formData.minCapacity || (formData.specs?.minCapacityG ? `${formData.specs.minCapacityG} g` : undefined),
        verificationIntervalE: formData.verificationIntervalE || (formData.specs?.verificationIntervalE ? `${formData.specs.verificationIntervalE} g` : undefined),
        actualIntervalD: formData.actualIntervalD || undefined,
        yearOfManufacture: Number(formData.yearOfManufacture),
        countryOfOrigin: formData.countryOfOrigin,
        manufacturerName: formData.manufacturerName || formData.make,
        specs: formData.specs,
        feePaymentRef: formData.feePaymentRef,
        location: {
          premisesName: formData.premisesName,
          address: formData.address,
          district: formData.district,
          state: formData.state,
          pinCode: formData.pinCode
        }
      };

      if (isOfficerOrAdmin) {
        if (traderMode === 'existing' && formData.ownerId) {
          payload.ownerId = formData.ownerId;
        } else if (traderMode === 'new' && formData.newTrader.name) {
          payload.newTrader = formData.newTrader;
        }
      }

      const res = await api.post('/instruments', payload);
      setSuccessMsg('Measuring Instrument registered successfully with statutory metrology parameters!');

      // Redirect after brief delay
      setTimeout(() => {
        if (user?.role === 'admin') {
          navigate('/admin');
        } else if (user?.role === 'lmo' || user?.role === 'gatc') {
          navigate('/officer');
        } else {
          navigate(`/apply?instrumentId=${res.data.instrument._id}`);
        }
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register instrument.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-3 text-sm">Loading statutory metrology parameters...</p>
      </div>
    );
  }

  const selectedTrader = traders.find(t => t._id === formData.ownerId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">
          e-Maap Statutory Registration • Legal Metrology Act, 2009
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">

        {/* Official Header Banner */}
        <div className="p-6 bg-gov-navy text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <Scale className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">Register Measuring Instrument</h1>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30">
                  Form 1 / Statutory Stamping
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statutory technical specifications &amp; model compliance under Legal Metrology (General) Rules, 2011
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-300">
            <div>Registrant: <span className="font-bold text-white">{user?.name}</span></div>
            <div className="text-[11px] text-amber-400 uppercase font-semibold">
              {user?.role === 'admin' ? 'State Controller HQ' : (user?.role === 'lmo' ? `LMO Inspector (${user.badgeNumber || 'DL-LMO'})` : (user?.role === 'gatc' ? 'GATC Lab' : 'Trader / Equipment Owner'))}
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

          {/* Section 0: Officer/Admin Equipment Custodian / Trader Assignment */}
          {isOfficerOrAdmin && (
            <div className="space-y-4 p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-700" />
                  0. Equipment Custodian / Commercial Trader Assignment
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Officer Privileged Action
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTraderMode('existing')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    traderMode === 'existing'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Select Existing Registered Trader
                </button>
                <button
                  type="button"
                  onClick={() => setTraderMode('new')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    traderMode === 'new'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  + Onboard New Commercial Trader
                </button>
              </div>

              {traderMode === 'existing' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Registered Commercial Trader / Business *
                    </label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                      className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {traders.length === 0 && <option value="">No registered traders found in district</option>}
                      {traders.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.orgDetails?.companyName ? `${t.orgDetails.companyName} (${t.name})` : t.name} — GSTIN: {t.orgDetails?.gstNumber || 'N/A'} • {t.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTrader && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs flex flex-wrap gap-4 text-slate-700">
                      <div><span className="text-slate-400">Enterprise:</span> <strong>{selectedTrader.orgDetails?.companyName || selectedTrader.name}</strong></div>
                      <div><span className="text-slate-400">GSTIN:</span> <strong className="font-mono">{selectedTrader.orgDetails?.gstNumber || 'Unregistered'}</strong></div>
                      <div><span className="text-slate-400">Contact:</span> {selectedTrader.phone || selectedTrader.email}</div>
                      <div><span className="text-slate-400">District:</span> {selectedTrader.orgDetails?.district || selectedTrader.jurisdictionDistrict || 'Delhi'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trader / Proprietor Name *</label>
                    <input
                      type="text"
                      required={traderMode === 'new'}
                      value={formData.newTrader.name}
                      onChange={(e) => setFormData({ ...formData, newTrader: { ...formData.newTrader, name: e.target.value } })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Enterprise Trade Name</label>
                    <input
                      type="text"
                      value={formData.newTrader.companyName}
                      onChange={(e) => setFormData({ ...formData, newTrader: { ...formData.newTrader, companyName: e.target.value } })}
                      placeholder="e.g. Kumar Oil &amp; Grain Traders"
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact *</label>
                    <input
                      type="tel"
                      required={traderMode === 'new'}
                      value={formData.newTrader.phone}
                      onChange={(e) => setFormData({ ...formData, newTrader: { ...formData.newTrader, phone: e.target.value } })}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={formData.newTrader.gstNumber}
                      onChange={(e) => setFormData({ ...formData, newTrader: { ...formData.newTrader, gstNumber: e.target.value.toUpperCase() } })}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Instrument Classification & Statutory Rule */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              1. Instrument Classification &amp; Metrology Standards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      {c.name} (Stamping Validity: {c.verificationValidityMonths} Months)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Verification Category *
                </label>
                <select
                  value={formData.verificationType}
                  onChange={(e) => setFormData({ ...formData, verificationType: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="initial_verification">Initial Stamping (Factory / Importer Stamping)</option>
                  <option value="periodical_reverification">Periodical Re-Verification &amp; Stamping</option>
                  <option value="post_repair">Verification Post-Repair / Security Seal Re-attachment</option>
                  <option value="field_seizure_test">Field Inspection / Surprise Test Verification</option>
                </select>
              </div>
            </div>

            {selectedCategory && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">{selectedCategory.name}</div>
                <div className="text-slate-500">{selectedCategory.description}</div>
                <div className="text-[11px] text-blue-800 font-medium">
                  Governing Statutory Code: <strong>{selectedCategory.applicableStandard}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Statutory Model Approval & Metrological Accuracy */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              2. Government Model Approval &amp; Accuracy Class (Section 22 Mandate)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Model Approval No. *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Section 22</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.modelApprovalNumber}
                  onChange={(e) => setFormData({ ...formData, modelApprovalNumber: e.target.value })}
                  placeholder="e.g. DLM/IND/APP/2026/104"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metrological Accuracy Class *
                </label>
                <select
                  value={formData.accuracyClass}
                  onChange={(e) => setFormData({ ...formData, accuracyClass: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Class I (Special)">Class I (Special) — Precision Analytical</option>
                  <option value="Class II (High)">Class II (High) — Gold &amp; Lab</option>
                  <option value="Class III (Medium)">Class III (Medium) — Retail &amp; Mandi Scales</option>
                  <option value="Class IIII (Ordinary)">Class IIII (Ordinary) — Bulk Goods</option>
                  <option value="Class 0.2">Class 0.2 — High Flow Meters</option>
                  <option value="Class 0.5">Class 0.5 — Commercial Fuel Dispensers</option>
                  <option value="Class 1">Class 1 — Industrial Metering</option>
                  <option value="N/A">N/A — General Measurement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={formData.countryOfOrigin}
                  onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                  placeholder="India"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Max Capacity (Max)</label>
                <input
                  type="text"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  placeholder="e.g. 30 kg / 60 L"
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Min Capacity (Min)</label>
                <input
                  type="text"
                  value={formData.minCapacity}
                  onChange={(e) => setFormData({ ...formData, minCapacity: e.target.value })}
                  placeholder="e.g. 100 g / 2 L"
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scale Interval (e)</label>
                <input
                  type="text"
                  value={formData.verificationIntervalE}
                  onChange={(e) => setFormData({ ...formData, verificationIntervalE: e.target.value })}
                  placeholder="e.g. 5 g / 10 mL"
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Actual Interval (d)</label>
                <input
                  type="text"
                  value={formData.actualIntervalD}
                  onChange={(e) => setFormData({ ...formData, actualIntervalD: e.target.value })}
                  placeholder="e.g. 1 g / 5 mL"
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Core Equipment Identifiers */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              3. Physical Plaque &amp; Manufacturer Identifiers
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
                  placeholder="e.g. Essae / Dräger / Gilbarco"
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
                  placeholder="e.g. DS-215 / Horizon Prime"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year of Manufacture
                </label>
                <input
                  type="number"
                  value={formData.yearOfManufacture}
                  onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer Legal Entity Name
                </label>
                <input
                  type="text"
                  value={formData.manufacturerName}
                  onChange={(e) => setFormData({ ...formData, manufacturerName: e.target.value })}
                  placeholder="e.g. Essae-Teraoka Pvt. Ltd."
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dynamic Category Specifications */}
          {selectedCategory && selectedCategory.specSchema && selectedCategory.specSchema.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                4. Category Dynamic Specifications ({selectedCategory.name})
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

          {/* Section 5: Statutory Fee & e-Treasury Challan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-700" />
              5. Statutory Stamping Fee &amp; BharatKosh / Treasury Challan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  e-Challan Reference Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.feePaymentRef.challanNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    feePaymentRef: { ...formData.feePaymentRef, challanNumber: e.target.value }
                  })}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stamping Fee (₹) Schedule XIV
                </label>
                <input
                  type="number"
                  value={formData.feePaymentRef.amountPaid}
                  onChange={(e) => setFormData({
                    ...formData,
                    feePaymentRef: { ...formData.feePaymentRef, amountPaid: Number(e.target.value) }
                  })}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Challan Payment Status
                </label>
                <select
                  value={formData.feePaymentRef.paymentStatus}
                  onChange={(e) => setFormData({
                    ...formData,
                    feePaymentRef: { ...formData.feePaymentRef, paymentStatus: e.target.value }
                  })}
                  className="w-full text-xs rounded-lg border-slate-300 border p-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Paid">Paid (Treasury Verified)</option>
                  <option value="Exempted">Exempted (Govt Agency)</option>
                  <option value="Pending">Pending Verification</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Installation Location & Premises */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              6. Installation Location &amp; Operational Premises
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premises / Counter / Dispenser Bay
                </label>
                <input
                  type="text"
                  value={formData.premisesName}
                  onChange={(e) => setFormData({ ...formData, premisesName: e.target.value })}
                  placeholder="e.g. Counter 1, Weighbridge Gate 2, Fuel Island 3"
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
                  placeholder="Shop No., Commercial Market, Road"
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
                  placeholder="e.g. Central Delhi / South Delhi"
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State &amp; Postal PIN Code
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

          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Records are electronically signed &amp; timestamped under IT Act, 2000.</span>
            </div>

            <div className="flex items-center gap-3">
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
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Scale className="w-4 h-4 text-amber-400" />
                {submitting ? 'Registering with DLM Registry...' : 'Register Measuring Instrument'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
