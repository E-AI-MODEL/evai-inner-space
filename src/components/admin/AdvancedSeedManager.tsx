import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash, Plus, Database, Upload, Download, BarChart, Settings } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';

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

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Valideren': return 'bg-green-100 text-green-800';
      case 'Reflectievraag': return 'bg-blue-100 text-blue-800';
      case 'Suggestie': return 'bg-purple-100 text-purple-800';
      case 'Interventie': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Zoek seeds..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">Alle types</option>
                      <option value="validation">Validatie</option>
                      <option value="reflection">Reflectie</option>
                      <option value="suggestion">Suggestie</option>
                      <option value="intervention">Interventie</option>
                    </select>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">Alle severity</option>
                      <option value="low">Laag</option>
                      <option value="medium">Gemiddeld</option>
                      <option value="high">Hoog</option>
                      <option value="critical">Kritiek</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={exportSeeds}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Export
                    </Button>
                    <Button 
                      onClick={() => setIsCreating(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Nieuwe Seed
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  {filteredSeeds.length} van {seedsData.length} seeds ({seedsData.filter(s => s.isActive).length} actief)
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emotie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Triggers</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Gebruik</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeeds.map((seed) => (
                      <TableRow key={seed.id}>
                        <TableCell className="font-medium">{seed.emotion}</TableCell>
                        <TableCell>
                          <Badge className={getLabelColor(seed.label)}>
                            {seed.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(seed.context.severity)}>
                            {seed.context.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {seed.triggers.slice(0, 2).map((trigger, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                            {seed.triggers.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{seed.triggers.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{seed.meta.weight.toFixed(1)}</TableCell>
                        <TableCell>{seed.meta.usageCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {seed.tags.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={seed.isActive ? "default" : "secondary"}>
                            {seed.isActive ? "Actief" : "Inactief"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSeed(seed)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSeed(seed)}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Totaal Seeds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{seedsData.length}</div>
                <div className="text-xs text-gray-500">
                  {seedsData.filter(s => s.isActive).length} actief
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Meest Gebruikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max(...seedsData.map(s => s.meta.usageCount), 0)}
                </div>
                <div className="text-xs text-gray-500">keer gebruikt</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gem. Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {seedsData.length > 0 
                    ? (seedsData.reduce((sum, s) => sum + s.meta.weight, 0) / seedsData.length).toFixed(1)
                    : '0.0'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
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
          onCancel={() => {
            setEditingSeed(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

interface AdvancedSeedEditorProps {
  seed?: AdvancedSeed | null;
  onSave: (seed: AdvancedSeed) => void;
  onCancel: () => void;
}

const AdvancedSeedEditor: React.FC<AdvancedSeedEditorProps> = ({ seed, onSave, onCancel }) => {
  const [formData, setFormData] = useState<AdvancedSeed>({
    id: seed?.id || uuidv4(),
    emotion: seed?.emotion || '',
    type: seed?.type || 'validation',
    label: seed?.label || 'Valideren',
    triggers: seed?.triggers || [],
    response: seed?.response || { nl: '' },
    context: seed?.context || {
      severity: 'medium',
      situation: 'therapy'
    },
    meta: seed?.meta || {
      priority: 1,
      ttl: 30,
      weight: 1.0,
      confidence: 0.8,
      usageCount: 0
    },
    tags: seed?.tags || [],
    createdAt: seed?.createdAt || new Date(),
    updatedAt: new Date(),
    createdBy: seed?.createdBy || 'admin',
    isActive: seed?.isActive ?? true,
    version: seed?.version || '1.0.0'
  });

  const [triggerInput, setTriggerInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleAddTrigger = () => {
    if (triggerInput.trim() && !formData.triggers.includes(triggerInput.trim())) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, triggerInput.trim()]
      }));
      setTriggerInput('');
    }
  };

  const handleRemoveTrigger = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter(t => t !== trigger)
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.emotion && formData.response.nl && formData.triggers.length > 0) {
      onSave(formData);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{seed ? 'Advanced Seed Bewerken' : 'Nieuwe Advanced Seed'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Emotie *</label>
              <Input
                value={formData.emotion}
                onChange={(e) => setFormData(prev => ({ ...prev, emotion: e.target.value }))}
                placeholder="bijv. stress, verdriet, onzekerheid"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value as AdvancedSeed['type'];
                  let label: AdvancedSeed['label'] = 'Valideren';
                  if (type === 'reflection') label = 'Reflectievraag';
                  else if (type === 'suggestion') label = 'Suggestie';
                  else if (type === 'intervention') label = 'Interventie';
                  
                  setFormData(prev => ({ ...prev, type, label }));
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="validation">Validatie</option>
                <option value="reflection">Reflectie</option>
                <option value="suggestion">Suggestie</option>
                <option value="intervention">Interventie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={formData.context.severity}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  context: { ...prev.context, severity: e.target.value as any }
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="low">Laag</option>
                <option value="medium">Gemiddeld</option>
                <option value="high">Hoog</option>
                <option value="critical">Kritiek</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.meta.weight}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meta: { ...prev.meta, weight: parseFloat(e.target.value) || 1.0 }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TTL (minuten)</label>
              <Input
                type="number"
                min="0"
                value={formData.meta.ttl || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meta: { ...prev.meta, ttl: parseInt(e.target.value) || undefined }
                }))}
              />
            </div>
          </div>

          
          
          <div>
            <label className="block text-sm font-medium mb-1">Triggers *</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                placeholder="Voeg trigger woord toe"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrigger())}
              />
              <Button type="button" onClick={handleAddTrigger}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.triggers.map((trigger, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTrigger(trigger)}>
                  {trigger} ×
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Response (Nederlands) *</label>
            <Textarea
              value={formData.response.nl}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                response: { ...prev.response, nl: e.target.value }
              }))}
              placeholder="De response die getoond wordt bij deze emotie"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Voeg tag toe"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm">Actief</label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuleren
            </Button>
            <Button type="submit">
              {seed ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdvancedSeedManager;
