
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdvancedSeed, LegacySeed } from '../../types/seed';
import { 
  loadAdvancedSeeds, 
  saveAdvancedSeeds, 
  addAdvancedSeed, 
  updateAdvancedSeed, 
  deleteAdvancedSeed 
} from '../../lib/advancedSeedStorage';
import { migrateLegacySeeds } from '../../utils/seedMigration';
import seeds from '../../seeds.json';
import AdvancedSeedTable from './AdvancedSeedTable';
import AdvancedSeedEditor from './AdvancedSeedEditor';
import AdvancedSeedStats from './AdvancedSeedStats';
import AdvancedSeedFilters from './AdvancedSeedFilters';

const AdvancedSeedManager = () => {
  const [seedsData, setSeedsData] = useState<AdvancedSeed[]>([]);
  const [editingSeed, setEditingSeed] = useState<AdvancedSeed | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadSeedsData();
  }, []);

  const loadSeedsData = () => {
    const advanced = loadAdvancedSeeds();
    setSeedsData(advanced);
  };

  const migrateLegacyData = () => {
    const legacySeeds = seeds as LegacySeed[];
    const migrated = migrateLegacySeeds(legacySeeds);
    saveAdvancedSeeds(migrated);
    loadSeedsData();
    toast({ 
      title: "Migratie voltooid", 
      description: `${migrated.length} legacy seeds zijn gemigreerd naar het nieuwe formaat.` 
    });
  };

  const filteredSeeds = seedsData.filter(seed => {
    const matchesSearch = seed.emotion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.triggers.some(trigger => trigger.toLowerCase().includes(searchTerm.toLowerCase())) ||
      seed.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || seed.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || seed.context.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const handleSaveSeed = (seed: AdvancedSeed) => {
    if (editingSeed) {
      updateAdvancedSeed(seed);
      toast({ title: "Seed bijgewerkt", description: "De advanced seed is succesvol bijgewerkt." });
    } else {
      addAdvancedSeed(seed);
      toast({ title: "Seed toegevoegd", description: "De nieuwe advanced seed is toegevoegd." });
    }
    setEditingSeed(null);
    setIsCreating(false);
    loadSeedsData();
  };

  const handleDeleteSeed = (seed: AdvancedSeed) => {
    deleteAdvancedSeed(seed.id);
    toast({ title: "Seed verwijderd", description: "De advanced seed is verwijderd." });
    loadSeedsData();
  };

  const exportSeeds = () => {
    const dataStr = JSON.stringify(seedsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evai-advanced-seeds-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export voltooid", description: "Seeds zijn geëxporteerd naar JSON bestand." });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
  };

  const handleCancelEdit = () => {
    setEditingSeed(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Beheer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="migration">Migratie</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Advanced Seed Beheer
              </CardTitle>
              <CardDescription>
                Beheer geavanceerde emotie seeds met contextuele matching en gewogen selectie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSeedFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterSeverity={filterSeverity}
                onFilterSeverityChange={setFilterSeverity}
                onExport={exportSeeds}
                onCreateNew={handleCreateNew}
                totalSeeds={seedsData.length}
                filteredCount={filteredSeeds.length}
                activeCount={seedsData.filter(s => s.isActive).length}
              />

              <AdvancedSeedTable
                seeds={filteredSeeds}
                onEdit={setEditingSeed}
                onDelete={handleDeleteSeed}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migratie Tools</CardTitle>
              <CardDescription>
                Migreer legacy seeds naar het nieuwe advanced formaat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Legacy Seeds Migratie</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Converteer {(seeds as LegacySeed[]).length} legacy seeds naar het nieuwe advanced formaat.
                  </p>
                  <Button onClick={migrateLegacyData} className="flex items-center gap-2">
                    <Upload size={16} />
                    Migreer Legacy Seeds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdvancedSeedStats seeds={seedsData} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systeem Instellingen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2">Experimentele Features</h4>
                  <p className="text-sm text-gray-600">
                    Advanced seed matching is momenteel in beta fase.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {(editingSeed || isCreating) && (
        <AdvancedSeedEditor
          seed={editingSeed}
          onSave={handleSaveSeed}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
};

export default AdvancedSeedManager;
