import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeeds } from '@/hooks/useSeeds';
import { Database } from 'lucide-react';

const SupabaseSeedOverview: React.FC = () => {
  const { data: seeds, isLoading, error } = useSeeds();

  const totalSeeds = seeds?.length || 0;
  const mostUsed = (seeds || [])
    .slice()
    .sort((a, b) => (b.meta?.usageCount || 0) - (a.meta?.usageCount || 0))
    .slice(0, 5);
  const recent = (seeds || [])
    .slice()
    .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
    .slice(0, 5);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database size={18} />
          Seed Overzicht
        </CardTitle>
        <CardDescription>Statistieken uit Supabase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p>Laden...</p>}
        {error && <p className="text-red-600">Fout bij laden</p>}
        {!isLoading && !error && (
          <>
            <div>
              <p className="text-sm text-gray-600">Totaal actieve seeds</p>
              <p className="text-2xl font-bold text-gray-800">{totalSeeds}</p>
            </div>
            <div>
              <h4 className="font-medium">Meest gebruikt</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {mostUsed.map(seed => (
                  <li key={seed.id}>
                    {(seed.label || seed.emotion) + ' '}({seed.meta?.usageCount || 0}x)
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Recent toegevoegd</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {recent.map(seed => (
                  <li key={seed.id}>
                    {(seed.label || seed.emotion) + ' '}(
                    {seed.createdAt ? seed.createdAt.toLocaleDateString('nl-NL') : ''})
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseSeedOverview;
