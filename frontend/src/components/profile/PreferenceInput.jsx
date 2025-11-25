import { useState } from 'react';
import { X } from 'lucide-react';

const PreferenceInput = ({ preferences, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addPreference = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !preferences.includes(trimmed)) {
      onChange([...preferences, trimmed]);
      setInputValue('');
    }
  };

  const removePreference = (pref) => {
    onChange(preferences.filter(p => p !== pref));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPreference();
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Low Sodium, No Cilantro..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
        />
        <button
          type="button"
          onClick={addPreference}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {preferences.map((pref) => (
          <span
            key={pref}
            className="bg-primary-500/20 border border-primary-500/30 text-primary-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
          >
            {pref}
            <button
              type="button"
              onClick={() => removePreference(pref)}
              className="hover:text-primary-100 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default PreferenceInput;
