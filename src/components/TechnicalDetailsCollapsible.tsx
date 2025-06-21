
import React, { useState } from 'react';
import { Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TechnicalDetailsCollapsibleProps {
  messageId: string;
  explainText?: string;
  meta?: string;
  symbolicInferences?: string[];
  label?: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
}

const TechnicalDetailsCollapsible: React.FC<TechnicalDetailsCollapsibleProps> = ({
  messageId,
  explainText,
  meta,
  symbolicInferences,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Don't render if there's no technical information to show
  const hasContent = explainText || meta || (symbolicInferences && symbolicInferences.length > 0);
  if (!hasContent) return null;

  const technicalId = `technical-${messageId}`;

  return (
    <div className="mt-2 ml-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors group">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Info size={14} className="text-gray-500" />
          <span>Technische Details</span>
          {meta && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
              {meta}
            </span>
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div
            id={technicalId}
            className="mt-3 p-4 bg-gray-50 border rounded-lg space-y-3 text-sm"
          >
            {/* Explanation Text */}
            {explainText && (
              <div className="space-y-1">
                <h4 className="font-medium text-gray-700">Redenering</h4>
                <p className="text-gray-600 italic leading-relaxed">{explainText}</p>
              </div>
            )}

            {/* Symbolic Inferences */}
            {symbolicInferences && symbolicInferences.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <span className="text-lg">
                    {label === "Reflectievraag" ? "🤔" : "🧠"}
                  </span>
                  {label === "Reflectievraag" 
                    ? "Reflectie Observaties" 
                    : "Neurosymbolische Observaties"}
                </h4>
                <div className={`${
                  label === "Reflectievraag" 
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400" 
                    : "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400"
                } rounded-r-lg p-3 space-y-2`}>
                  {symbolicInferences.map((inference, index) => (
                    <div key={index} className={`${
                      label === "Reflectievraag" ? "text-purple-700" : "text-indigo-700"
                    } flex items-start gap-2`}>
                      <span className={`${
                        label === "Reflectievraag" ? "text-purple-400" : "text-indigo-400"
                      } mt-0.5 flex-shrink-0`}>•</span>
                      <span className="flex-1 leading-relaxed">{inference}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default TechnicalDetailsCollapsible;
