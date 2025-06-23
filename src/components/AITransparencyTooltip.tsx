import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface AITransparencyTooltipProps {
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout";
  reasoning?: string;
  techniques?: string[];
  reliability?: number;
  gapAnalysis?: string;
}

const AITransparencyTooltip: React.FC<AITransparencyTooltipProps> = ({
  label,
  reasoning,
  techniques = [],
  reliability = 0.85,
  gapAnalysis
}) => {
  const getDefaultReasoning = (label: string) => {
    switch (label) {
      case "Valideren":
        return "AI detecteerde bevestigende taal en emotionele ondersteuning in je bericht.";
      case "Reflectievraag":
        return "AI identificeerde een kans voor diepere zelfreflectie gebaseerd op je uitingen.";
      case "Suggestie":
        return "AI vond patronen die duiden op behoefte aan praktische oplossingen.";
      case "Fout":
        return "AI detecteerde mogelijk problematische inhoud of technische fouten.";
      default:
        return "AI analyseerde je bericht met natuurlijke taalverwerking.";
    }
  };

  const getDefaultTechniques = (label: string) => {
    switch (label) {
      case "Valideren":
        return ["Sentimentanalyse", "Emotieherkenning", "EvAI-56 Rubrieken"];
      case "Reflectievraag":
        return ["Patroonherkenning", "Metacognitieve analyse", "Zelfbewustzijn-rubrieken"];
      case "Suggestie":
        return ["Probleemdetectie", "Oplossingsgeneratie", "Gedragsanalyse"];
      case "Fout":
        return ["Inhoudsfiltering", "Veiligheidscontrole", "Contextanalyse"];
      default:
        return ["Natuurlijke taalverwerking"];
    }
  };

  const finalReasoning = reasoning || getDefaultReasoning(label);
  const finalTechniques = techniques.length > 0 ? techniques : getDefaultTechniques(label);
  const reliabilityPercentage = Math.round(reliability * 100);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors">
          <Info size={12} className="text-black/60" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 bg-white border border-gray-300 shadow-lg z-50" 
        side="top" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1 text-gray-900">Waarom dit label?</h4>
            <p className="text-xs text-gray-700 leading-relaxed">{finalReasoning}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2 text-gray-900">AI Technieken gebruikt:</h4>
            <div className="flex flex-wrap gap-1">
              {finalTechniques.map((technique, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-800 border border-gray-200">
                  {technique}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-1 text-gray-900">Betrouwbaarheid</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${reliabilityPercentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-800">{reliabilityPercentage}%</span>
            </div>
          </div>

          {gapAnalysis && (
            <div>
              <h4 className="font-semibold text-sm mb-1 text-gray-900">Analyse Details</h4>
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-2 rounded">
                {gapAnalysis}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AITransparencyTooltip;
