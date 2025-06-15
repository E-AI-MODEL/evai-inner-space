
import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange, onSave }) => {
  const [showKey, setShowKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Key size={16} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-800">OpenAI API Key</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:underline ml-auto"
        >
          {isExpanded ? 'Verberg' : 'Configureer'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          <p className="text-xs text-blue-700">
            Voer je OpenAI API key in om AI-gedreven emotiedetectie te gebruiken. 
            De key wordt lokaal opgeslagen in je browser.
          </p>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={onSave}
              disabled={!value.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;
