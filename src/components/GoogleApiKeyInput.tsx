
import React, { useState } from 'react';
import { Key, Eye, EyeOff, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GoogleApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const GoogleApiKeyInput: React.FC<GoogleApiKeyInputProps> = ({ value, onChange, onSave }) => {
  const [showKey, setShowKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    onSave();
    toast({
      title: "Google API Key opgeslagen",
      description: "Je Google API key is lokaal opgeslagen voor neurosymbolische features.",
    });
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={16} className="text-purple-600" />
        <span className="text-sm font-medium text-purple-800">Google Gemini API Key</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-purple-600 hover:underline ml-auto"
        >
          {isExpanded ? 'Verberg' : 'Configureer'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          <p className="text-xs text-purple-700">
            Voer je Google Gemini API key in voor neurosymbolische AI features zoals 
            automatische seed generatie en conversatie patroon analyse.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-md p-2">
             <p className="text-xs text-green-800">
               <span className="font-semibold">🧠 Neurosymbolisch:</span> Deze key wordt gebruikt voor zelf-lerende 
               conversatie analyse en intelligente therapeutische seed generatie.
             </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="AIza..."
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
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleApiKeyInput;
