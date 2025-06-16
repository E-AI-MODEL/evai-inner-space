
import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OpenAIApiKey2InputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const OpenAIApiKey2Input: React.FC<OpenAIApiKey2InputProps> = ({ value, onChange, onSave }) => {
  const [showKey, setShowKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    onSave();
    toast({
      title: "Tweede OpenAI Key opgeslagen",
      description: "Extra AI-functionaliteit is nu ingeschakeld.",
    });
  };

  const isActive = value && value.trim().length > 0;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Key size={16} className="text-purple-600" />
        <span className="text-sm font-medium text-purple-800">OpenAI API Key 2</span>
        <div className="flex items-center gap-2 ml-auto">
          {isActive ? (
            <CheckCircle size={14} className="text-green-600" />
          ) : (
            <AlertCircle size={14} className="text-orange-500" />
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-purple-600 hover:underline"
          >
            {isExpanded ? 'Verberg' : 'Configureer'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          <p className="text-xs text-purple-700">
            Voer hier een tweede OpenAI API key in om uitgebreide analyse en seed generatie te activeren.
          </p>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-md p-3">
             <div className="flex items-center gap-2 mb-2">
               <Key size={14} className="text-blue-600" />
               <span className="text-xs font-semibold text-gray-800">🚀 Dubbele OpenAI</span>
             </div>
             <p className="text-xs text-gray-700">
               Deze sleutel wordt gebruikt voor functies die eerder van de Google key afhankelijk waren.
             </p>
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
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAIApiKey2Input;
