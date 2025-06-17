
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AdminRubricsOverview from './AdminRubricsOverview';
import AdvancedSeedManager from './AdvancedSeedManager';
import AdminAnalytics from './AdminAnalytics';
import AdminSystemMonitor from './AdminSystemMonitor';
import SupabaseDataTest from './SupabaseDataTest';
import SeedLearningLog from './SeedLearningLog';
import SystemHealthCheck from './SystemHealthCheck';
import AdminSystemSettings from './AdminSystemSettings';
import { Message } from '../../types';

interface AdminTabsContentProps {
  hasRubricActivity: boolean;
  messages: Message[];
}

const AdminTabsContent: React.FC<AdminTabsContentProps> = ({ hasRubricActivity, messages }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <TabsContent value="analyse" className="space-y-4 sm:space-y-6 mt-0">
        <div className="overflow-hidden">
          <AdminRubricsOverview messages={messages} />
        </div>
      </TabsContent>

      <TabsContent value="seeds" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Kennisbank Management</h2>
          <p className="text-sm text-gray-600 break-words">AI-gestuurde emotionele intelligence seeds</p>
        </div>
        <div className="overflow-hidden">
          <AdvancedSeedManager />
        </div>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Data Analytics</h2>
          <p className="text-sm text-gray-600 break-words">Deep learning insights en effectiviteit</p>
        </div>
        <div className="overflow-hidden">
          <AdminAnalytics messages={messages} />
        </div>
      </TabsContent>

      <TabsContent value="system" className="space-y-4 sm:space-y-6 mt-0">
        <div className="text-center mb-4 sm:mb-6 px-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Systeem Instellingen</h2>
          <p className="text-sm text-gray-600 break-words">Configuratie en monitoring</p>
        </div>
        <div className="overflow-hidden space-y-4">
          <AdminSystemSettings />
          <SystemHealthCheck />
          <AdminSystemMonitor messages={messages} />
          <SupabaseDataTest />
          <SeedLearningLog />
        </div>
      </TabsContent>
    </div>
  );
};

export default AdminTabsContent;
