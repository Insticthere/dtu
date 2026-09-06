import React, { useState } from 'react';
import { CheckCircle, AlertCircle, UploadCloud, Info, X } from 'lucide-react';

export default function DynamicInspectionForm({ schema = [], initialValues = {}, onChange, readOnly = false }) {
  const [values, setValues] = useState(initialValues);

  const handleFieldChange = (id, val) => {
    const updated = { ...values, [id]: val };
    setValues(updated);
    if (onChange) onChange(updated);
  };

  if (!schema || schema.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
        No specific dynamic inspection checkpoints defined for this category. Standard verification protocol applies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schema.map((field, idx) => {
        const fieldVal = values[field.id] !== undefined ? values[field.id] : (field.default !== undefined ? field.default : '');

        return (
          <div
            key={field.id || idx}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                {field.label}
                {field.required && <span className="text-rose-500">*</span>}
              </label>

              {field.unit && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium self-start sm:self-auto">
                  Unit: {field.unit}
                </span>
              )}
            </div>

            {field.description && (
              <p className="text-xs text-slate-500 mb-2.5 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>{field.description}</span>
              </p>
            )}

            {/* Field Input based on field.type */}
            {readOnly ? (
              <div className="text-sm font-medium text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {fieldVal !== '' ? (
                  typeof fieldVal === 'boolean' ? (fieldVal ? 'Pass / Yes' : 'Fail / No') : (
                    <span>{fieldVal} {field.unit || ''}</span>
                  )
                ) : (
                  <span className="text-slate-400 italic">Not recorded</span>
                )}
              </div>
            ) : (
              <div>
                {field.type === 'select' ? (
                  <select
                    value={fieldVal}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full text-sm rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2.5 border"
                  >
                    <option value="">-- Select Observation --</option>
                    {(field.options || ['Pass', 'Fail']).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'number' ? (
                  <div className="relative rounded-lg shadow-sm">
                    <input
                      type="number"
                      step="any"
                      value={fieldVal}
                      onChange={(e) => handleFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`Enter observed value in ${field.unit || 'units'}`}
                      required={field.required}
                      className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 p-2.5 border pr-16"
                    />
                    {field.unit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-semibold">
                        {field.unit}
                      </div>
                    )}
                  </div>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        name={field.id}
                        checked={fieldVal === true || fieldVal === 'true'}
                        onChange={() => handleFieldChange(field.id, true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Pass / Compliant</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input
                        type="radio"
                        name={field.id}
                        checked={fieldVal === false || fieldVal === 'false'}
                        onChange={() => handleFieldChange(field.id, false)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Fail / Non-compliant</span>
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={fieldVal}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder="Enter observation notes / reading"
                    required={field.required}
                    className="w-full text-sm rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
