
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Database, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOpenAISeedGenerator } from '../../hooks/useOpenAISeedGenerator';
import { useEvAI56Rubrics } from '../../hooks/useEvAI56Rubrics';
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
  const [rubricsMode, setRubricsMode] = useState(false);
  
  const { 
    generateSeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating 
  } = useOpenAISeedGenerator();

  const { evai56Rubrics } = useEvAI56Rubrics();

  useEffect(() => {
    loadSeedDatabase();
  }, []);

  const loadSeedDatabase = async () => {
    const seeds = await loadAdvancedSeeds();
    setSeedDatabase(seeds);
  };

  // Enhanced emotion list based on EvAI 5.6 rubrics
  const rubricBasedEmotions = [
    // Emotional regulation
    'paniek', 'overweldiging', 'emotionele labiliteit', 'verlies van controle',
    // Self-awareness  
    'zelfverwijt', 'perfectionalisme', 'negatief zelfbeeld', 'zelfkritiek',
    // Coping strategies
    'vermijding', 'onmacht', 'destructieve coping', 'isolatie',
    // Social connection
    'eenzaamheid', 'sociale angst', 'relationele problemen', 'gebrek aan steun',
    // Meaning & purpose
    'zinloosheid', 'leegte', 'doelloosheid', 'existentiële crisis', 'hopelessness'
  ];

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

    const emotionsToProcess = rubricsMode ? rubricBasedEmotions : commonMissingEmotions;

    try {
      for (const emotion of emotionsToProcess) {
        // Check if seed already exists
        const existingSeed = seedDatabase.find(s => 
          s.emotion.toLowerCase() === emotion.toLowerCase()
        );
        
        if (existingSeed) {
          console.log(`⏭️ Skipping ${emotion} - already exists`);
          continue;
        }

        setCurrentEmotion(emotion);
        console.log(`🌱 ${rubricsMode ? 'Rubrics-based' : 'Standard'} generation for: ${emotion}`);

        try {
          // Enhanced context for rubrics-based generation
          const context = rubricsMode 
            ? `EvAI 5.6 rubrics-validated therapeutische ondersteuning voor ${emotion} - focus op evidence-based interventies`
            : `Therapeutische ondersteuning voor ${emotion}`;

          const severity = rubricBasedEmotions.includes(emotion) ? 'high' : 'medium';

          const generatedSeed = await generateSeed({
            emotion,
            context,
            severity
          }, apiKey);

          if (generatedSeed) {
            const injected = await injectSeedToDatabase(generatedSeed);
            if (injected) {
              setGeneratedCount(prev => prev + 1);
              setInjectedCount(prev => prev + 1);
              
              toast({
                title: `🌱 ${rubricsMode ? 'Rubrics' : 'Standard'} Seed toegevoegd`,
                description: `Nieuwe seed voor '${emotion}' gegenereerd en geïnjecteerd`,
              });
            }
          }
        } catch (error) {
          console.error(`❌ Failed to generate seed for ${emotion}:`, error);
        }

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      // Refresh database
      loadSeedDatabase();
      
      toast({
        title: "🚀 Smart Seed Injection Voltooid",
        description: `${injectedCount} nieuwe ${rubricsMode ? 'rubrics-validated' : 'standard'} seeds toegevoegd`,
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

  const progress = (rubricsMode ? rubricBasedEmotions : commonMissingEmotions).length > 0 
    ? (generatedCount / (rubricsMode ? rubricBasedEmotions : commonMissingEmotions).length) * 100 
    : 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          Smart Seed Injector 2.0
          {isActive && <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {rubricsMode ? 'Rubrics Mode' : 'Standard Mode'}
          </Badge>}
        </CardTitle>
        <CardDescription>
          Intelligente seed generatie met EvAI 5.6 rubrics validatie voor zelf-lerend systeem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
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
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{evai56Rubrics.length}</div>
            <div className="text-xs text-gray-600">Rubrics</div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            variant={!rubricsMode ? "default" : "outline"}
            onClick={() => setRubricsMode(false)}
            size="sm"
            className="flex-1"
          >
            <Zap size={14} className="mr-1" />
            Standard Mode ({commonMissingEmotions.length})
          </Button>
          <Button
            variant={rubricsMode ? "default" : "outline"}
            onClick={() => setRubricsMode(true)}
            size="sm"
            className="flex-1"
          >
            <Target size={14} className="mr-1" />
            Rubrics Mode ({rubricBasedEmotions.length})
          </Button>
        </div>

        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Genereren van {rubricsMode ? 'rubrics-validated' : 'standard'} seeds...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentEmotion && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Zap size={14} className="animate-pulse text-yellow-500" />
                Bezig met: <Badge variant="outline">{currentEmotion}</Badge>
                {rubricsMode && <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Rubrics</Badge>}
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
                Start {rubricsMode ? 'Rubrics' : 'Standard'} Injection
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
          <strong>Zelf-lerend Systeem:</strong>
          <ul className="mt-1 space-y-1">
            <li>• <strong>Standard Mode:</strong> Algemene emoties voor dagelijks gebruik</li>
            <li>• <strong>Rubrics Mode:</strong> EvAI 5.6 validated therapeutische patronen</li>
            <li>• Automatische emotie herkenning en adaptatie</li>
            <li>• Real-time learning van gebruikersinteracties</li>
            <li>• OpenAI + Rubrics = Optimale therapeutische ondersteuning</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSeedInjector;
