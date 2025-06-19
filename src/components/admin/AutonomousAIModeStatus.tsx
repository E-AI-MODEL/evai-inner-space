
import React from 'react';

interface AutonomousAIModeStatusProps {
  isAutonomous: boolean;
}

const AutonomousAIModeStatus: React.FC<AutonomousAIModeStatusProps> = ({
  isAutonomous
}) => {
  if (isAutonomous) {
    return (
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-xs text-purple-700 mb-2">
          <strong>🤖 Autonome modus ACTIEF</strong>
        </p>
        <p className="text-xs text-purple-600 mb-2">
          De AI leert nu automatisch van gesprekken en verbetert real-time de responskwaliteit door:
        </p>
        <ul className="text-xs text-purple-600 space-y-1 ml-4">
          <li>• <strong>Real-time seed learning</strong> - Nieuwe emotiepatronen worden direct toegepast</li>
          <li>• <strong>Neurosymbolic integration</strong> - Betere matching tussen gesprek en kennisbank</li>
          <li>• <strong>Adaptive responses</strong> - Antwoorden worden aangepast aan gesprekscontext</li>
          <li>• <strong>Background learning</strong> - Continue verbetering van de AI tijdens gebruik</li>
        </ul>
        <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-700">
          ✅ <strong>Je krijgt nu de hoogste kwaliteit responses</strong> met real-time learning
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <p className="text-xs text-orange-700 mb-2">
        <strong>⚠️ Autonome modus UITGESCHAKELD</strong>
      </p>
      <p className="text-xs text-orange-600 mb-2">
        Zonder autonome modus krijg je basis responses. Schakel in voor:
      </p>
      <ul className="text-xs text-orange-600 space-y-1 ml-4">
        <li>• <strong>Betere emotieherkenning</strong> - Meer gepersonaliseerde responses</li>
        <li>• <strong>Real-time learning</strong> - AI past zich aan tijdens gesprekken</li>
        <li>• <strong>Hogere responskwaliteit</strong> - Meer empathische en relevante antwoorden</li>
        <li>• <strong>Adaptieve intelligentie</strong> - Continu verbeterende gespreksvoering</li>
      </ul>
      <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-700">
        💡 <strong>Tip:</strong> Schakel de autonome modus in voor de beste gesprekservaring
      </div>
    </div>
  );
};

export default AutonomousAIModeStatus;
