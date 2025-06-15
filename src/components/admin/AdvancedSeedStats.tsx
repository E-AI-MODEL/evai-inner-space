
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSeed } from '../../types/seed';

interface AdvancedSeedStatsProps {
  seeds: AdvancedSeed[];
}

const AdvancedSeedStats: React.FC<AdvancedSeedStatsProps> = ({ seeds }) => {
  const totalSeeds = seeds.length;
  const activeSeeds = seeds.filter(s => s.isActive).length;
  const maxUsage = Math.max(...seeds.map(s => s.meta.usageCount), 0);
  const averageWeight = totalSeeds > 0 
    ? (seeds.reduce((sum, s) => sum + s.meta.weight, 0) / totalSeeds).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Totaal Seeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSeeds}</div>
          <div className="text-xs text-gray-500">
            {activeSeeds} actief
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Meest Gebruikt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maxUsage}</div>
          <div className="text-xs text-gray-500">keer gebruikt</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gem. Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageWeight}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSeedStats;
