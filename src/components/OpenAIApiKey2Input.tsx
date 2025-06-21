
import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface OpenAIApiKey2InputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const OpenAIApiKey2Input: React.FC<OpenAIApiKey2InputProps> = ({ value, onChange, onSave }) => {
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Key size={16} className="text-purple-600" />
        <span className="text-sm font-medium text-purple-800">API Key 2 - Enhanced Analysis</span>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default OpenAIApiKey2Input;
