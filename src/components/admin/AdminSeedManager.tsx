
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash, Plus, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import seeds from '../../seeds.json';

interface Seed {
  emotion: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  triggers: string[];
  response: string;
  meta: string;
}

const AdminSeedManager = () => {
  const [seedsData, setSeedsData] = useState<Seed[]>(seeds as Seed[]);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSeeds = seedsData.filter(seed => 
    seed.emotion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seed.triggers.some(trigger => trigger.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveSeed = (seed: Seed) => {
    if (editingSeed) {
      setSeedsData(prev => prev.map(s => s === editingSeed ? seed : s));
      toast({ title: "Seed bijgewerkt", description: "De seed is succesvol bijgewerkt." });
    } else {
      setSeedsData(prev => [...prev, seed]);
      toast({ title: "Seed toegevoegd", description: "De nieuwe seed is toegevoegd." });
    }
    setEditingSeed(null);
    setIsCreating(false);
  };

  const handleDeleteSeed = (seed: Seed) => {
    setSeedsData(prev => prev.filter(s => s !== seed));
    toast({ title: "Seed verwijderd", description: "De seed is verwijderd." });
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Valideren': return 'bg-green-100 text-green-800';
      case 'Reflectievraag': return 'bg-blue-100 text-blue-800';
      case 'Suggestie': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Seed Beheer
          </CardTitle>
          <CardDescription>
            Beheer emotie seeds voor lokale herkenning en responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Zoek seeds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Nieuwe Seed
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emotie</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Response Preview</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeeds.map((seed, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{seed.emotion}</TableCell>
                    <TableCell>
                      <Badge className={getLabelColor(seed.label)}>
                        {seed.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {seed.triggers.slice(0, 3).map((trigger, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                        {seed.triggers.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{seed.triggers.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {seed.response}
                    </TableCell>
                    <TableCell>{seed.meta}</TableCell>
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

      {(editingSeed || isCreating) && (
        <SeedEditor
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

interface SeedEditorProps {
  seed?: Seed | null;
  onSave: (seed: Seed) => void;
  onCancel: () => void;
}

const SeedEditor: React.FC<SeedEditorProps> = ({ seed, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Seed>({
    emotion: seed?.emotion || '',
    label: seed?.label || 'Valideren',
    triggers: seed?.triggers || [],
    response: seed?.response || '',
    meta: seed?.meta || '30m – Normaal'
  });
  const [triggerInput, setTriggerInput] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.emotion && formData.response && formData.triggers.length > 0) {
      onSave(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{seed ? 'Seed Bewerken' : 'Nieuwe Seed'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Emotie</label>
              <Input
                value={formData.emotion}
                onChange={(e) => setFormData(prev => ({ ...prev, emotion: e.target.value }))}
                placeholder="bijv. stress, verdriet, onzekerheid"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <select
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="Valideren">Valideren</option>
                <option value="Reflectievraag">Reflectievraag</option>
                <option value="Suggestie">Suggestie</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Triggers</label>
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
            <label className="block text-sm font-medium mb-1">Response</label>
            <Textarea
              value={formData.response}
              onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
              placeholder="De response die getoond wordt bij deze emotie"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta</label>
            <Input
              value={formData.meta}
              onChange={(e) => setFormData(prev => ({ ...prev, meta: e.target.value }))}
              placeholder="bijv. 30m – Hoog"
            />
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

export default AdminSeedManager;
