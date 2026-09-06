import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  ShieldCheck,
  QrCode,
  Search,
  CheckCircle2,
  Layers,
  Clock,
  FileCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    // If it looks like a certificate number (LM-VER-...) or QR token
    navigate(`/verify/${query}`);
  };

  const handleQuickLogin = async (email, roleName) => {
    try {
      await login(email, 'password123');
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('lmo') || email.includes('gatc')) navigate('/officer');
      else navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gov-navy via-slate-900 to-slate-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Under India's Legal Metrology Act, 2009 & General Rules 2011</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            National Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">Legal Metrology</span> Verification System
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            End-to-end statutory verification, dynamic tolerance testing, and instant tamper-proof QR certification for commercial weights, fuel dispensers, breath analysers, and precision measuring instruments.
          </p>

          {/* Public Search Box for Verification */}
          <div className="max-w-2xl mx-auto pt-4">
            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
              <div className="relative flex-1 flex items-center">
                <QrCode className="w-5 h-5 text-amber-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter QR Token or Certificate No. (e.g. 4f8a92e10bc78d234a5b6c7d8e9f0123)"
                  className="w-full bg-transparent text-white placeholder-slate-400 text-sm px-3 py-2.5 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Verify Authenticity
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-2">
              Try sample QR Token: <button onClick={() => setSearchQuery('4f8a92e10bc78d234a5b6c7d8e9f0123')} className="text-amber-400 underline font-mono">4f8a92e10bc78d234a5b6c7d8e9f0123</button>
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="pt-6 border-t border-slate-800/80 max-w-4xl mx-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> One-Click Demo Role Access:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleQuickLogin('admin@metrology.gov.in', 'Admin')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl border border-purple-500/30 text-xs font-semibold transition-all hover:scale-102 flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-white">Admin HQ</span>
                <span className="text-[10px] text-purple-400">Manage Categories & Allocations</span>
              </button>
              <button
                onClick={() => handleQuickLogin('lmo.verma@metrology.gov.in', 'LMO')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-blue-300 rounded-xl border border-blue-500/30 text-xs font-semibold transition-all hover:scale-102 flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-white">LMO Inspector</span>
                <span className="text-[10px] text-blue-400">Inspect & Issue Certificates</span>
              </button>
              <button
                onClick={() => handleQuickLogin('gatc.lab@testcentre.org', 'GATC')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 rounded-xl border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-102 flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-white">GATC Test Lab</span>
                <span className="text-[10px] text-emerald-400">Govt Approved Test Centre</span>
              </button>
              <button
                onClick={() => handleQuickLogin('ramesh.traders@gmail.com', 'User')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-500/30 text-xs font-semibold transition-all hover:scale-102 flex flex-col items-center gap-0.5"
              >
                <span className="font-bold text-white">Trader / User</span>
                <span className="text-[10px] text-amber-400">Register & Apply</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Key Architectural Innovations in e-Metrology
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Built specifically to digitize compliance workflows mandated by the Department of Consumer Affairs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic Inspection Schemas</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every category (e.g. Weighing Scales, Evidential Breath Analysers, Fuel Dispensers) defines its own statutory checkpoints, tolerances, and calibration parameters as dynamic JSON schemas without code modifications.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Public QR Verification</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Each certificate generates a secure, unguessable cryptographic token embedded into a QR code. Consumers and enforcement officers can scan to verify live validity status, masked owner details, and stamping dates.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Automated Expiry Alerts</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Daily automated cron jobs calculate validity expiration windows and dispatch multi-stage notifications at 60, 30, and 7 days before certificate expiration to ensure zero compliance gaps.
            </p>
          </div>
        </div>
      </section>

      {/* Role Lifecycle Diagram */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Complete Verification Flow</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              From Instrument Registration to QR Certification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-3">1</span>
              <h4 className="font-bold text-slate-900 text-sm">1. Instrument Registration</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Trader registers scale / dispenser with serial number, specifications, and premises address.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-3">2</span>
              <h4 className="font-bold text-slate-900 text-sm">2. Allocation & Scheduling</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Admin or LMO assigns application to an officer, sets inspection date, and selects venue.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center mb-3">3</span>
              <h4 className="font-bold text-slate-900 text-sm">3. Dynamic Inspection</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Officer records observations against category's dynamic schema, uploads photo proof, and records Pass/Fail.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">4</span>
              <h4 className="font-bold text-slate-900 text-sm">4. Digital Certificate & QR</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                On Pass, the system automatically generates a digitally signed certificate PDF with an active QR code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-gov-navy to-blue-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black">
              Ready to verify or manage metrology instruments?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sign in with sample credentials or create an account to start experiencing India's digitized Legal Metrology verification platform.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                Register as Trader
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 transition-colors"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
