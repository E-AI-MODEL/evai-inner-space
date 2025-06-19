
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SeedInjectorStatsProps {
  totalSeeds: number;
  generatedCount: number;
  injectedCount: number;
  typeVariety: number;
  isActive: boolean;
}

const SeedInjectorStats: React.FC<SeedInjectorStatsProps> = ({
  totalSeeds,
  generatedCount,
  injectedCount,
  typeVariety,
  isActive
}) => {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="text-center p-3 bg-white rounded-lg border">
        <div className="text-2xl font-bold text-purple-600">{totalSeeds}</div>
        <div className="text-xs text-gray-600">Totaal Seeds</div>
      </div>
      <div className="text-center p-3 bg-white rounded-lg border">
        <div className="text-2xl font-bold text-green-600">{generatedCount}</div>
        <div className="text-xs text-gray-600">Gegenereerd</div>
      </div>
      <div className="text-center p-3 bg-white rounded-lg border">
        <div className="text-2xl font-bold text-blue-600">{injectedCount}</div>
        <div className="text-xs text-gray-600">Geïnjecteerd</div>
      </div>
      <div className="text-center p-3 bg-white rounded-lg border">
        <div className="text-2xl font-bold text-orange-600">{typeVariety}</div>
        <div className="text-xs text-gray-600">Type Variatie</div>
      </div>
    </div>
  );
};

export default SeedInjectorStats;
