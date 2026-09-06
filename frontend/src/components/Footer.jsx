import React from 'react';
import { Scale, ShieldCheck, FileText, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500 rounded-lg text-slate-900">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-base">Legal Metrology Portal</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official digital verification and certification platform for weights & measures under India's Legal Metrology Act, 2009 and Legal Metrology (General) Rules, 2011.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Tamper-Evident QR Code Verification Active</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Statutory Portals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/verify" className="hover:text-amber-400 transition-colors">Public Certificate Verification</Link></li>
              <li><Link to="/dashboard" className="hover:text-amber-400 transition-colors">Trader Instrument Management</Link></li>
              <li><Link to="/officer" className="hover:text-amber-400 transition-colors">LMO Inspection Portal</Link></li>
              <li><Link to="/admin" className="hover:text-amber-400 transition-colors">GATC & State Metrology Console</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Instruments Covered</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Electronic Weighing Scales (Class I - IV)</li>
              <li>• Evidential Breath Alcohol Analysers (EBA)</li>
              <li>• Automatic Fuel Dispensing Units</li>
              <li>• Weighbridges & Electronic Platform Scales</li>
              <li>• Flow Meters & Taximeters</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Legal & Security</h4>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <Lock className="w-3.5 h-3.5" />
                <span>Statutory Compliance Notice</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Using unverified weights and measures in commercial trade is punishable with fines and imprisonment under Section 30 of the Act.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Directorate of Legal Metrology, Department of Consumer Affairs, Government of India.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>e-Governance Metrology Standard v1.0 (MVP)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
