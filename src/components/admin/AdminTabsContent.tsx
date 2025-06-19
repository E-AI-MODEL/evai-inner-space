
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import AdminRubricsOverview from './AdminRubricsOverview';
import AdvancedSeedManager from './AdvancedSeedManager';
import AdminAnalytics from './AdminAnalytics';
import ConnectionStatusDashboard from './ConnectionStatusDashboard';
import AutonomousAIMode from './AutonomousAIMode';
import NeurosymbolicArchitectureDiagram from './NeurosymbolicArchitectureDiagram';
import RubricSettings from '../RubricSettings';
import SeedLearningLog from './SeedLearningLog';
import EmbeddingConfiguration from './EmbeddingConfiguration';
import { Message } from '../../types';

interface AdminTabsContentProps {
  hasRubricActivity: boolean;
  messages: Message[];
}

const AdminTabsContent: React.FC<AdminTabsContentProps> = ({ hasRubricActivity, messages }) => {
  const navigate = useNavigate();

  const quickStartSteps = [
    {
      title: "API Keys configureren",
      description: "Stel je OpenAI API keys in",
      action: "Ga naar instellingen (⚙️)",
      completed: false
    },
    {
      title: "Kennisbank vullen",
      description: "Voeg emotion seeds toe",
      action: "Bekijk Kennisbank tab",
      completed: false
    },
    {
      title: "Prestaties monitoren",
      description: "Controleer AI performance",
      action: "Bekijk Analyse tab",
      completed: false
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <TabsContent value="handleiding" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">EvAI Setup Handleiding</h2>
          <p className="text-sm text-gray-600 break-words">
            Alles wat je nodig hebt om EvAI optimaal te configureren
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Quick Start Card */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Checklist</CardTitle>
              <CardDescription>
                Volg deze stappen voor een optimale setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickStartSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                  <CheckCircle 
                    className={`h-5 w-5 ${step.completed ? 'text-green-500' : 'text-gray-300'}`} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    {step.action}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Full Guide Link */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Volledige Stap-voor-Stap Handleiding
                </h3>
                <p className="text-gray-600 text-sm">
                  Bekijk de complete handleiding met gedetailleerde instructies, 
                  tips en best practices voor EvAI configuratie.
                </p>
                <Button 
                  onClick={() => navigate('/admin/guide')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Volledige Handleiding
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Embedding Configuration */}
          <EmbeddingConfiguration />
        </div>
      </TabsContent>

      <TabsContent value="analyse" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">AI Prestatie Analyse</h2>
          <p className="text-sm text-gray-600 break-words">Hoe presteert de AI en wat weet hij over gesprekken?</p>
        </div>
        <div className="overflow-hidden space-y-4">
          <RubricSettings />
          <AdminRubricsOverview messages={messages} />
        </div>
      </TabsContent>

      <TabsContent value="kennisbank" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Kennisbank Management</h2>
          <p className="text-sm text-gray-600 break-words">Wat weet de AI en hoe leert hij (handmatig & autonoom)?</p>
        </div>
        <div className="overflow-hidden space-y-4">
          <AutonomousAIMode />
          <AdvancedSeedManager />
          <SeedLearningLog />
        </div>
      </TabsContent>

      <TabsContent value="data" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Data Analytics</h2>
          <p className="text-sm text-gray-600 break-words">Ruwe cijfers voor diepgaande analyse</p>
        </div>
        <div className="overflow-hidden">
          <AdminAnalytics messages={messages} />
        </div>
      </TabsContent>

      <TabsContent value="systeem" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Systeem Configuratie</h2>
          <p className="text-sm text-gray-600 break-words">Hoe werkt het, is het gezond, en hoe configureer ik het?</p>
        </div>
        <div className="overflow-hidden space-y-4">
          <ConnectionStatusDashboard />
          <NeurosymbolicArchitectureDiagram />
        </div>
      </TabsContent>
    </div>
  );
};

export default AdminTabsContent;
