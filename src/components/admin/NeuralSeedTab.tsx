
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AdvancedSeed } from '../../types/seed';
import { v4 as uuidv4 } from 'uuid';

interface NeuralSeedTabProps {
  openAiKey2: string;
  seeds: AdvancedSeed[];
  onSeedGenerated: () => void;
}

const NeuralSeedTab: React.FC<NeuralSeedTabProps> = ({ openAiKey2, seeds, onSeedGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState('');

  const generateSeedWithAI = async (emotion: string, triggers: string[]) => {
    if (!openAiKey2.trim()) {
      toast({
        title: "Geen tweede OpenAI key",
        description: "Voeg eerst de tweede OpenAI key toe voor AI-gegenereerde seeds.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey2}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: `Genereer een therapeutische response voor de emotie "${emotion}" met triggers: ${triggers.join(', ')}. Geef alleen de Nederlandse response text terug, maximaal 100 woorden, empathisch en ondersteunend.` }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) throw new Error('OpenAI API fout');

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content?.trim() || 'Ik begrijp hoe je je voelt.';
      
      // Import the function dynamically to avoid circular dependency
      const { addAdvancedSeed } = await import('../../lib/advancedSeedStorage');
      
      const newSeed: AdvancedSeed = {
        id: uuidv4(),
        emotion,
        type: 'validation',
        label: 'Valideren',
        triggers,
        response: { nl: generatedText },
        context: {
          severity: 'medium',
          situation: 'therapy'
        },
        meta: {
          priority: 1,
          weight: 1.0,
          confidence: 0.8,
          usageCount: 0,
          ttl: 30
        },
        tags: ['ai-generated'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'ai',
        isActive: true,
        version: '1.0.0'
      };

      await addAdvancedSeed(newSeed);
      onSeedGenerated();
      toast({
        title: "AI Seed gegenereerd",
        description: `Nieuwe seed voor "${emotion}" is aangemaakt.`
      });
    } catch (error) {
      toast({
        title: "AI Generatie gefaald",
        description: "Kon geen seed genereren met OpenAI.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeConversationPattern = async () => {
    if (!openAiKey2.trim()) {
      toast({
        title: "Geen tweede OpenAI key",
        description: "Deze functie vereist de tweede OpenAI key.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const usageData = seeds
        .filter(seed => seed.meta.usageCount > 0)
        .sort((a, b) => b.meta.usageCount - a.meta.usageCount)
        .slice(0, 5);

      const analysisPrompt = `
        Analyseer deze emotie-patronen van therapeutische sessies:
        ${usageData.map(seed => `${seed.emotion}: ${seed.meta.usageCount} keer gebruikt, severity: ${seed.context.severity}`).join('\n')}
        
        Geef 3 concrete aanbevelingen voor nieuwe seeds die ontbreken, gebaseerd op deze patronen.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey2}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.6,
          max_tokens: 300
        })
      });

      if (!response.ok) throw new Error('OpenAI API fout');

      const data = await response.json();
      const recommendations =
        data.choices[0]?.message?.content?.trim() ||
        'Geen aanbevelingen beschikbaar.';
      setAnalysisResults(recommendations);

      toast({
        title: "Patroon Analyse Voltooid",
        description: "Analyse voltooid. Resultaten hieronder."
      });

      console.log('🧠 Neurosymbolische Patroon Analyse:', recommendations);
    } catch (error) {
      toast({
        title: "Analyse gefaald",
        description: "Kon conversatiepatronen niet analyseren.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧠 Neurosymbolische AI Engine</CardTitle>
        <CardDescription>
          Zelf-lerende conversatie analyse en seed generatie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">AI Seed Generatie</h4>
            <p className="text-sm text-gray-600 mb-4">
              Laat OpenAI (key 2) nieuwe therapeutische seeds genereren
            </p>
            <div className="flex gap-2">
              <Input placeholder="Emotie (bijv. angst)" className="flex-1" id="new-emotion" />
              <Button 
                onClick={() => {
                  const emotion = (document.getElementById('new-emotion') as HTMLInputElement)?.value;
                  if (emotion) generateSeedWithAI(emotion, [emotion]);
                }}
                disabled={isGenerating}
              >
                {isGenerating ? 'Bezig...' : 'Genereer'}
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Patroon Analyse</h4>
            <p className="text-sm text-gray-600 mb-4">
              Analyseer conversatiepatronen en ontbrekende emoties
            </p>
          <Button
              onClick={analyzeConversationPattern}
              className="w-full"
              disabled={isAnalyzing}
            >
              <BarChart size={16} className="mr-2" />
              {isAnalyzing ? 'Bezig...' : 'Analyseer Patronen'}
            </Button>
            {analysisResults && (
              <pre className="mt-2 p-2 bg-white text-xs rounded border">
                {analysisResults}
              </pre>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuralSeedTab;
