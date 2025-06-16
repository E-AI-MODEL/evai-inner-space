
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOpenAISeedGenerator } from '../../hooks/useOpenAISeedGenerator';
import { loadAdvancedSeeds } from '../../lib/advancedSeedStorage';

interface SmartSeedInjectorProps {
  apiKey: string;
}

const SmartSeedInjector: React.FC<SmartSeedInjectorProps> = ({ apiKey }) => {
  const [isActive, setIsActive] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [injectedCount, setInjectedCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [seedDatabase, setSeedDatabase] = useState<any[]>([]);
  
  const { 
    generateSeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating 
  } = useOpenAISeedGenerator();

  useEffect(() => {
    loadSeedDatabase();
  }, []);

  const loadSeedDatabase = () => {
    const seeds = loadAdvancedSeeds();
    setSeedDatabase(seeds);
  };

  const commonMissingEmotions = [
    'faalangst', 'perfectionisme', 'eenzaamheid', 'overweldiging', 
    'teleurstelling', 'onmacht', 'schaamte', 'schuld', 'rouw',
    'jaloezie', 'frustratie', 'onzekerheid', 'angst', 'paniek'
  ];

  const runSmartSeedGeneration = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key vereist",
        description: "Stel eerst een OpenAI API key in.",
        variant: "destructive"
      });
      return;
    }

    setIsActive(true);
    setGeneratedCount(0);
    setInjectedCount(0);

    try {
      for (const emotion of commonMissingEmotions) {
        // Check if seed already exists
        const existingSeed = seedDatabase.find(s => 
          s.emotion.toLowerCase() === emotion.toLowerCase()
        );
        
        if (existingSeed) {
          console.log(`⏭️ Skipping ${emotion} - already exists`);
          continue;
        }

        setCurrentEmotion(emotion);
        console.log(`🌱 Generating seed for: ${emotion}`);

        try {
          const generatedSeed = await generateSeed({
            emotion,
            context: `Therapeutische ondersteuning voor ${emotion}`,
            severity: 'medium'
          }, apiKey);

          if (generatedSeed) {
            const injected = await injectSeedToDatabase(generatedSeed);
            if (injected) {
              setGeneratedCount(prev => prev + 1);
              setInjectedCount(prev => prev + 1);
              
              toast({
                title: "🌱 Seed toegevoegd",
                description: `Nieuwe seed voor '${emotion}' gegenereerd en geïnjecteerd`,
              });
            }
          }
        } catch (error) {
          console.error(`❌ Failed to generate seed for ${emotion}:`, error);
        }

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Refresh database
      loadSeedDatabase();
      
      toast({
        title: "🚀 Smart Seed Injection Voltooid",
        description: `${injectedCount} nieuwe seeds toegevoegd aan database`,
      });

    } catch (error) {
      console.error('Smart seed generation error:', error);
      toast({
        title: "Fout bij seed generatie",
        description: "Er ging iets mis tijdens automatische seed generatie.",
        variant: "destructive"
      });
    } finally {
      setIsActive(false);
      setCurrentEmotion('');
    }
  };

  const progress = commonMissingEmotions.length > 0 
    ? (generatedCount / commonMissingEmotions.length) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          Smart Seed Injector
          {isActive && <Badge variant="secondary" className="bg-purple-100 text-purple-800">Actief</Badge>}
        </CardTitle>
        <CardDescription>
          Automatische seed generatie en injectie met OpenAI voor ontbrekende emoties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{seedDatabase.length}</div>
            <div className="text-xs text-gray-600">Totaal Seeds</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{generatedCount}</div>
            <div className="text-xs text-gray-600">Gegenereerd</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{injectedCount}</div>
            <div className="text-xs text-gray-600">Geïnjecteerd</div>
          </div>
        </div>

        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Genereren van seeds...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentEmotion && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Zap size={14} className="animate-pulse text-yellow-500" />
                Bezig met: <Badge variant="outline">{currentEmotion}</Badge>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button 
            onClick={runSmartSeedGeneration}
            disabled={isActive || !apiKey.trim()}
            className="flex-1"
          >
            {isActive ? (
              <>
                <Brain size={16} className="mr-2 animate-pulse" />
                Genereren...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Start Smart Injection
              </>
            )}
          </Button>
          {apiKey.trim() ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
        </div>

        <div className="text-xs text-gray-600 bg-white p-3 rounded border">
          <strong>Hoe het werkt:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Analyseert ontbrekende emoties in seed database</li>
            <li>• Genereert therapeutische seeds met OpenAI</li>
            <li>• Injecteert automatisch in AdvancedSeed database</li>
            <li>• Verbetert emotiedetectie en responses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSeedInjector;
