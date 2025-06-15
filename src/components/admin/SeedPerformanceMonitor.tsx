
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
import { AdvancedSeed } from '../../types/seed';

interface SeedPerformanceMonitorProps {
  seeds: AdvancedSeed[];
}

const SeedPerformanceMonitor: React.FC<SeedPerformanceMonitorProps> = ({ seeds }) => {
  const performanceMetrics = React.useMemo(() => {
    const topPerformers = seeds
      .filter(s => s.meta.usageCount > 0)
      .sort((a, b) => b.meta.usageCount - a.meta.usageCount)
      .slice(0, 5);

    const underPerformers = seeds
      .filter(s => s.isActive && s.meta.usageCount === 0)
      .slice(0, 5);

    const recentlyUsed = seeds
      .filter(s => s.meta.lastUsed)
      .sort((a, b) => new Date(b.meta.lastUsed!).getTime() - new Date(a.meta.lastUsed!).getTime())
      .slice(0, 5);

    const avgUsage = seeds.length > 0 
      ? seeds.reduce((sum, s) => sum + s.meta.usageCount, 0) / seeds.length 
      : 0;

    return {
      topPerformers,
      underPerformers,
      recentlyUsed,
      avgUsage: avgUsage.toFixed(1)
    };
  }, [seeds]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceMetrics.topPerformers.map((seed, index) => (
                <div key={seed.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm">{seed.emotion}</span>
                    <Badge variant="outline" className="text-xs">
                      {seed.label}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">
                    {seed.meta.usageCount}x
                  </span>
                </div>
              ))}
              {performanceMetrics.topPerformers.length === 0 && (
                <p className="text-sm text-gray-500">Geen gebruiksdata beschikbaar</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown size={16} className="text-orange-600" />
              Under Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceMetrics.underPerformers.map((seed) => (
                <div key={seed.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{seed.emotion}</span>
                    <Badge variant="outline" className="text-xs">
                      {seed.label}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">Niet gebruikt</span>
                </div>
              ))}
              {performanceMetrics.underPerformers.length === 0 && (
                <p className="text-sm text-gray-500">Alle seeds worden gebruikt</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {performanceMetrics.recentlyUsed.map((seed) => (
              <div key={seed.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{seed.emotion}</span>
                  <Badge variant="outline" className="text-xs">
                    {seed.label}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {seed.meta.lastUsed ? 
                    new Date(seed.meta.lastUsed).toLocaleDateString() : 
                    'Nooit'
                  }
                </span>
              </div>
            ))}
            {performanceMetrics.recentlyUsed.length === 0 && (
              <p className="text-sm text-gray-500">Geen recente activiteit</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target size={16} className="text-purple-600" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gemiddeld gebruik per seed:</span>
              <Badge variant="secondary">{performanceMetrics.avgUsage}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Actieve seeds:</span>
              <Badge variant="secondary">{seeds.filter(s => s.isActive).length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ongebruikte seeds:</span>
              <Badge variant="secondary">{performanceMetrics.underPerformers.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedPerformanceMonitor;
