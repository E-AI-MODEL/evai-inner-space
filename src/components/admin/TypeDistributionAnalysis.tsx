
import React from 'react';
import { PieChart } from 'lucide-react';

interface TypeDistribution {
  type: string;
  expected: number;
  actual: number;
  count: number;
}

interface TypeDistributionAnalysisProps {
  expectedDistribution: TypeDistribution[];
}

const TypeDistributionAnalysis: React.FC<TypeDistributionAnalysisProps> = ({
  expectedDistribution
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <PieChart size={16} />
        Type Distributie Analyse
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {expectedDistribution.map(({ type, expected, actual, count }) => (
          <div key={type} className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-medium capitalize">{type}</div>
            <div className="text-xs text-gray-600">
              {count} seeds ({actual}%)
            </div>
            <div className="text-xs text-blue-600">
              Doel: {expected}%
            </div>
            <div className={`text-xs ${actual >= expected ? 'text-green-600' : 'text-orange-600'}`}>
              {actual >= expected ? '✓' : '↗'} {actual >= expected ? 'Goed' : 'Verbeteren'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypeDistributionAnalysis;
