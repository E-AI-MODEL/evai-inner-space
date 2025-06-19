
import React from 'react';

const AutonomousAIModeDescription: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-800 mb-2">🧠 Hoe Autonome AI werkt</h4>
        <div className="text-xs text-purple-700 space-y-2">
          <p>
            <strong>Real-time Integration:</strong> De autonome AI is nu volledig geïntegreerd met het hoofdgesprek. 
            Elke response wordt verbeterd door autonomous learning.
          </p>
          <p>
            <strong>Neurosymbolic Workflow:</strong> Combineert symbolische regels met neurale netwerken 
            voor optimale responskwaliteit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-semibold text-green-700 mb-1">🔄 Real-time Learning</div>
          <div className="text-green-600">Nieuwe patronen worden direct tijdens gesprekken geleerd en toegepast</div>
        </div>
        
        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="font-semibold text-blue-700 mb-1">🎯 Adaptive Matching</div>
          <div className="text-blue-600">AI past responses aan op basis van gesprekscontext en geschiedenis</div>
        </div>
        
        <div className="p-2 bg-purple-50 border border-purple-200 rounded">
          <div className="font-semibold text-purple-700 mb-1">🌱 Seed Generation</div>
          <div className="text-purple-600">Automatische creatie van nieuwe emotiepatronen tijdens gesprekken</div>
        </div>
        
        <div className="p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="font-semibold text-orange-700 mb-1">📊 Quality Enhancement</div>
          <div className="text-orange-600">Continue verbetering van responskwaliteit en empathie</div>
        </div>
      </div>

      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-700">
          <strong>✨ Resultaat:</strong> Met autonome modus krijg je responses van therapeutische kwaliteit 
          die zich real-time aanpassen aan jouw unieke gesprekspatronen en emotionele behoeften.
        </p>
      </div>
    </div>
  );
};

export default AutonomousAIModeDescription;
