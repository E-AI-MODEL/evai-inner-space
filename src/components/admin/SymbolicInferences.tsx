
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

interface SymbolicStats {
  messageCount: number;
  total: number;
  secondary: number;
  topInferences: Array<[string, number]>;
}

interface SymbolicInferencesProps {
  stats: SymbolicStats;
}

const SymbolicInferences: React.FC<SymbolicInferencesProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} />
          Symbolic Inferences
        </CardTitle>
        <CardDescription>Samenvatting van gedetecteerde patronen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <p>
            {stats.messageCount} berichten bevatten {stats.total} observaties.
          </p>
          <p>{stats.secondary} afkomstig van de tweede API.</p>
          <ul className="list-disc pl-5 space-y-1">
            {stats.topInferences.map(([inf, count]) => (
              <li key={inf}>
                {inf} ({count}x)
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SymbolicInferences;
