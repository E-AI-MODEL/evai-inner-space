
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AdminRubricsOverview from './AdminRubricsOverview';
import AdvancedSeedManager from './AdvancedSeedManager';
import AdminAnalytics from './AdminAnalytics';
import ConnectionStatusDashboard from './ConnectionStatusDashboard';
import AutonomousAIMode from './AutonomousAIMode';
import NeurosymbolicArchitectureDiagram from './NeurosymbolicArchitectureDiagram';
import RubricStrictnessControl from '../RubricStrictnessControl';
import RubricSettings from '../RubricSettings';
import SeedLearningLog from './SeedLearningLog';
import { Message } from '../../types';

interface AdminTabsContentProps {
  hasRubricActivity: boolean;
  messages: Message[];
}

const AdminTabsContent: React.FC<AdminTabsContentProps> = ({ hasRubricActivity, messages }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <TabsContent value="analyse" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">AI Prestatie Analyse</h2>
          <p className="text-sm text-gray-600 break-words">Hoe presteert de AI en wat weet hij over gesprekken?</p>
        </div>
        <div className="overflow-hidden space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RubricStrictnessControl />
            <RubricSettings />
          </div>
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
