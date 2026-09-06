import React, { useState } from 'react';
import { Plus, Trash2, Layers, MoveDown, Check } from 'lucide-react';

export default function DynamicSchemaBuilder({ schema = [], onChange }) {
  const [fields, setFields] = useState(schema);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'number',
      unit: '',
      required: true,
      description: '',
      options: ['Pass', 'Fail']
    };
    const updated = [...fields, newField];
    setFields(updated);
    if (onChange) onChange(updated);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    if (key === 'label' && (!updated[index].id || updated[index].id.startsWith('field_'))) {
      updated[index].id = value.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
    }
    setFields(updated);
    if (onChange) onChange(updated);
  };

  const removeField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Dynamic Inspection Form Checkpoints
          </h4>
          <p className="text-xs text-slate-500">
            Define custom statutory checkpoints for this instrument category. Officers will be prompted with these fields during verification.
          </p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Checkpoint
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-sm text-slate-500 font-medium">No inspection checkpoints added yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Checkpoint" to define tolerance tests, repeatability checks, or sensor readings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Checkpoint #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                  title="Remove Checkpoint"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Checkpoint Title / Label *
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, 'label', e.target.value)}
                    placeholder="e.g. Accuracy at 50% Capacity Test"
                    required
                    className="w-full text-xs rounded-lg border-slate-300 p-2 border focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Input Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, 'type', e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-300 p-2 border focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="number">Number (with Unit)</option>
                    <option value="select">Dropdown (Pass / Fail)</option>
                    <option value="text">Text Notes</option>
                    <option value="boolean">Yes / No Switch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement (Optional)
                  </label>
                  <input
                    type="text"
                    value={field.unit || ''}
                    onChange={(e) => updateField(idx, 'unit', e.target.value)}
                    placeholder="e.g. kg, g, ml, %, mg/100ml"
                    className="w-full text-xs rounded-lg border-slate-300 p-2 border focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tolerance / Statutory Instructions
                  </label>
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => updateField(idx, 'description', e.target.value)}
                    placeholder="e.g. Maximum Permissible Error must not exceed ± 5g"
                    className="w-full text-xs rounded-lg border-slate-300 p-2 border focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
