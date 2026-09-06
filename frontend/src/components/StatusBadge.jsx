import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const getBadgeStyle = (st) => {
    switch (st?.toLowerCase()) {
      case 'certified':
      case 'active':
      case 'pass':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-600/20';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-600/20';
      case 'submitted':
      case 'pending_verification':
        return 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-600/20';
      case 'rejected':
      case 'fail':
      case 'expired':
      case 'revoked':
        return 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-600/20';
      case 'unverified':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/20';
    }
  };

  const formatText = (st) => {
    if (!st) return 'Unknown';
    if (st === 'pending_verification') return 'Pending Verification';
    return st.charAt(0).toUpperCase() + st.slice(1);
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${getBadgeStyle(status)} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {formatText(status)}
    </span>
  );
}
