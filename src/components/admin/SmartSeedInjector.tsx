import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap, Database, CheckCircle, AlertCircle, Target, PieChart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOpenAISeedGenerator } from '../../hooks/useOpenAISeedGenerator';
import { useEvAI56Rubrics } from '../../hooks/useEvAI56Rubrics';
import { useEnhancedSeedGeneration } from '../../hooks/useEnhancedSeedGeneration';
import { loadAdvancedSeeds } from '../../lib/advancedSeedStorage';
import type { AdvancedSeed } from '../../types/seed';

interface SmartSeedInjectorProps {
  apiKey: string;
}

const SmartSeedInjector: React.FC<SmartSeedInjectorProps> = ({ apiKey }) => {
  const [isActive, setIsActive] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [injectedCount, setInjectedCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [seedDatabase, setSeedDatabase] = useState<AdvancedSeed[]>([]);
  const [rubricsMode, setRubricsMode] = useState(false);
  const [typeDistribution, setTypeDistribution] = useState<Record<string, number>>({});
  
  const { 
    generateSeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating 
  } = useOpenAISeedGenerator();

  const { SEED_TYPE_WEIGHTS } = useEnhancedSeedGeneration();
  const { evai56Rubrics } = useEvAI56Rubrics();

  useEffect(() => {
    loadSeedDatabase();
  }, []);

  const loadSeedDatabase = async () => {
    const seeds = await loadAdvancedSeeds();
    setSeedDatabase(seeds);
    
    // Calculate current type distribution
    const distribution = seeds.reduce((acc, seed) => {
      acc[seed.type] = (acc[seed.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    setTypeDistribution(distribution);
  };

  // Enhanced emotion list with variety focus
  const enhancedEmotionList = [
    // High-variety emotions for better type distribution
    { emotion: 'paniek', severity: 'critical' as const, expectedType: 'intervention' },
    { emotion: 'onzekerheid', severity: 'medium' as const, expectedType: 'reflection' },
    { emotion: 'motivatie', severity: 'low' as const, expectedType: 'suggestion' },
    { emotion: 'verdriet', severity: 'medium' as const, expectedType: 'validation' },
    { emotion: 'frustratie', severity: 'high' as const, expectedType: 'suggestion' },
    { emotion: 'eenzaamheid', severity: 'high' as const, expectedType: 'reflection' },
    { emotion: 'stress', severity: 'high' as const, expectedType: 'intervention' },
    { emotion: 'teleurstelling', severity: 'medium' as const, expectedType: 'reflection' },
    { emotion: 'angst', severity: 'high' as const, expectedType: 'intervention' },
    { emotion: 'blijdschap', severity: 'low' as const, expectedType: 'validation' },
    { emotion: 'woede', severity: 'high' as const, expectedType: 'suggestion' },
    { emotion: 'schaamte', severity: 'medium' as const, expectedType: 'reflection' }
  ];

  const commonMissingEmotions = [
    'faalangst', 'perfectionalisme', 'eenzaamheid', 'overweldiging', 
    'teleurstelling', 'onmacht', 'schaamte', 'schuld', 'rouw',
    'jaloezie', 'frustratie', 'onzekerheid', 'angst', 'paniek'
  ];

  const runEnhancedSeedGeneration = async () => {
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

    const emotionsToProcess = rubricsMode ? enhancedEmotionList : enhancedEmotionList.slice(0, 8);

    try {
      for (const emotionConfig of emotionsToProcess) {
        const emotion = typeof emotionConfig === 'string' ? emotionConfig : emotionConfig.emotion;
        const severity = typeof emotionConfig === 'object' ? emotionConfig.severity : 'medium';
        
        // Check if seed already exists
        const existingSeed = seedDatabase.find(s => 
          s.emotion.toLowerCase() === emotion.toLowerCase()
        );
        
        if (existingSeed) {
          console.log(`⏭️ Skipping ${emotion} - already exists`);
          continue;
        }

        setCurrentEmotion(emotion);
        console.log(`🌱 Enhanced generation for: ${emotion} (${severity})`);

        try {
          const context = rubricsMode 
            ? `EvAI 5.6 enhanced therapeutische ondersteuning voor ${emotion} - variatie in type focus`
            : `Therapeutische ondersteuning voor ${emotion} met type diversiteit`;

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
                title: `🌱 ${generatedSeed.type} seed toegevoegd`,
                description: `${generatedSeed.label} voor '${emotion}' gegenereerd`,
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
        title: "🚀 Enhanced Seed Generation Voltooid",
        description: `${injectedCount} diverse seeds toegevoegd met verbeterde type variatie`,
      });

    } catch (error) {
      console.error('Enhanced seed generation error:', error);
      toast({
        title: "Fout bij enhanced generatie",
        description: "Er ging iets mis tijdens automatische seed generatie.",
        variant: "destructive"
      });
    } finally {
      setIsActive(false);
      setCurrentEmotion('');
    }
  };

  const progress = enhancedEmotionList.length > 0 
    ? (generatedCount / enhancedEmotionList.length) * 100 
    : 0;

  // Calculate expected vs actual type distribution
  const totalSeeds = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
  const expectedDistribution = Object.entries(SEED_TYPE_WEIGHTS).map(([type, weight]) => ({
    type,
    expected: Math.round(weight * 100),
    actual: totalSeeds > 0 ? Math.round((typeDistribution[type] || 0) / totalSeeds * 100) : 0,
    count: typeDistribution[type] || 0
  }));

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          Enhanced Smart Seed Injector 3.0
          {isActive && <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Enhanced Mode
          </Badge>}
        </CardTitle>
        <CardDescription>
          Intelligente seed generatie met verbeterde type variatie en therapeutische focus
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
            <div className="text-2xl font-bold text-orange-600">{Object.keys(typeDistribution).length}</div>
            <div className="text-xs text-gray-600">Type Variatie</div>
          </div>
        </div>

        {/* Type Distribution Dashboard */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <PieChart size={16} />
            Type Distributie Analyse
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {expectedDistribution.map(({ type, expected, actual, count }) => (
              <div key={type} className="text-center p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium capitalize">{type}</div>
                <div className="text-xs text-gray-600">
                  {count} seeds ({actual}%)
                </div>
                <div className="text-xs text-blue-600">
                  Doel: {expected}%
                </div>
                <div className={`text-xs ${actual >= expected ? 'text-green-600' : 'text-orange-600'}`}>
                  {actual >= expected ? '✓' : '↗'} {actual >= expected ? 'Goed' : 'Verbeteren'}
                </div>
              </div>
            ))}
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
            Enhanced Mode ({enhancedEmotionList.slice(0, 8).length})
          </Button>
          <Button
            variant={rubricsMode ? "default" : "outline"}
            onClick={() => setRubricsMode(true)}
            size="sm"
            className="flex-1"
          >
            <Target size={14} className="mr-1" />
            Full Variety ({enhancedEmotionList.length})
          </Button>
        </div>

        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Genereren van diverse seed types...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentEmotion && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Zap size={14} className="animate-pulse text-yellow-500" />
                Bezig met: <Badge variant="outline">{currentEmotion}</Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">Enhanced</Badge>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button 
            onClick={runEnhancedSeedGeneration}
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
                Start Enhanced Generation
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
          <strong>Enhanced Seed Generation v3.0:</strong>
          <ul className="mt-1 space-y-1">
            <li>• <strong>Type Variety:</strong> Intelligente distributie van validatie, reflectie, suggestie en interventie</li>
            <li>• <strong>Context Awareness:</strong> Severity-based type selection voor optimale therapeutische match</li>
            <li>• <strong>Quality Prompts:</strong> Type-specifieke instructies voor authentieke responses</li>
            <li>• <strong>Distribution Analysis:</strong> Real-time monitoring van type balans</li>
            <li>• <strong>Therapeutic Focus:</strong> Evidence-based seed generation met EvAI rubrics</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSeedInjector;
