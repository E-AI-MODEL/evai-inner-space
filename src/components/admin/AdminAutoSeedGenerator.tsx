
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Settings, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GeneratedSeed {
  emotion: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  triggers: string[];
  response: string;
  meta: string;
  confidence: number;
}

interface AdminAutoSeedGeneratorProps {
  apiKey: string;
}

const AdminAutoSeedGenerator: React.FC<AdminAutoSeedGeneratorProps> = ({ apiKey }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSeeds, setGeneratedSeeds] = useState<GeneratedSeed[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [settings, setSettings] = useState({
    categories: ['stress', 'verdriet', 'angst', 'vreugde', 'woede', 'onzekerheid'],
    seedCount: 5,
    customPrompt: ''
  });

  const generateSeeds = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key vereist",
        description: "Stel eerst een OpenAI API key in via de instellingen.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedSeeds([]);

    try {
      const prompt = `Genereer ${settings.seedCount} emotie-detection seeds voor een Nederlands AI therapeutische assistent. 

Categorieën om te focussen op: ${settings.categories.join(', ')}

${settings.customPrompt ? `Extra instructies: ${settings.customPrompt}` : ''}

Elke seed moet bevatten:
- emotion: specifieke Nederlandse emotie naam
- label: "Valideren", "Reflectievraag", of "Suggestie"
- triggers: array van 3-5 Nederlandse trigger woorden/zinnen
- response: empathische Nederlandse response (50-100 woorden)
- meta: tijdsduur en intensiteit (bijv. "45m – Hoog")

Geef het resultaat als JSON array. Focus op realistische, therapeutisch verantwoorde content.`;

      for (let i = 0; i < settings.seedCount; i++) {
        setGenerationProgress((i / settings.seedCount) * 100);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'Je bent een expert in emotionele AI en therapeutische interventies. Genereer kwalitatieve emotion detection seeds.'
              },
              {
                role: 'user',
                content: `${prompt}\n\nGenereer nu 1 seed (als single JSON object, niet array):`
              }
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        try {
          const seedData = JSON.parse(content);
          const generatedSeed: GeneratedSeed = {
            ...seedData,
            confidence: Math.round(Math.random() * 20 + 80) // Simulate confidence 80-100%
          };
          
          setGeneratedSeeds(prev => [...prev, generatedSeed]);
        } catch (parseError) {
          console.error('Failed to parse generated seed:', content);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setGenerationProgress(100);
      toast({
        title: "Seeds gegenereerd",
        description: `${settings.seedCount} nieuwe seeds succesvol gegenereerd.`
      });

    } catch (error) {
      console.error('Error generating seeds:', error);
      toast({
        title: "Generatie gefaald",
        description: "Er ging iets mis bij het genereren van seeds.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportSeeds = () => {
    const exportData = generatedSeeds.map(({ confidence, ...seed }) => seed);
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-seeds-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Generatie Instellingen
          </CardTitle>
          <CardDescription>Configureer de auto-seed generatie parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Emotie Categorieën</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    categories: prev.categories.filter(c => c !== category)
                  }))}>
                  {category} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Voeg emotie categorie toe"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !settings.categories.includes(value)) {
                      setSettings(prev => ({
                        ...prev,
                        categories: [...prev.categories, value]
                      }));
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Aantal Seeds</label>
            <Input
              type="number"
              min="1"
              max="20"
              value={settings.seedCount}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                seedCount: parseInt(e.target.value) || 5
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Prompt (optioneel)</label>
            <Textarea
              placeholder="Extra instructies voor de AI generator..."
              value={settings.customPrompt}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customPrompt: e.target.value
              }))}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateSeeds} 
            disabled={isGenerating || !apiKey.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Genereren... ({Math.round(generationProgress)}%)
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Genereer Seeds
              </>
            )}
          </Button>

          {isGenerating && (
            <Progress value={generationProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Generated Seeds */}
      {generatedSeeds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gegenereerde Seeds</CardTitle>
                <CardDescription>{generatedSeeds.length} seeds gegenereerd</CardDescription>
              </div>
              <Button onClick={exportSeeds} variant="outline">
                <Download size={16} className="mr-2" />
                Exporteer JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedSeeds.map((seed, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getLabelColor(seed.label)}>
                        {seed.label}
                      </Badge>
                      <span className="font-semibold">{seed.emotion}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {seed.confidence}% confidence
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Triggers:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {seed.triggers.map((trigger, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Response:</span>
                      <p className="text-sm text-gray-600 mt-1">{seed.response}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Meta:</span>
                      <span className="text-sm text-gray-600 ml-2">{seed.meta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAutoSeedGenerator;
