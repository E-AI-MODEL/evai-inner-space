import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AutonomyConsole from '@/components/admin/AutonomyConsole';
import AdvancedSeedManager from '@/components/admin/AdvancedSeedManager';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import { useNavigate } from 'react-router-dom';
import { useSystemConnectivity } from '@/hooks/useSystemConnectivity';
import { getStatusIcon as getStatusIconGeneric, getStatusColor as getStatusColorGeneric } from '@/utils/statusUtils';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'autonomy' | 'seeds' | 'settings'>('autonomy');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const { status: connectivity, refresh: refreshConnectivity, isChecking } = useSystemConnectivity();

  const mapToHealth = (status: string): 'healthy' | 'warning' | 'error' => {
    switch (status) {
      case 'connected': return 'healthy';
      case 'connecting': return 'warning';  
      case 'disconnected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 p-4 md:p-8 pt-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
              EvAI Autonomous System
            </h2>
            <p className="text-muted-foreground">
              Real-time autonomous AI operations center
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
            <TabsContent value="autonomy" className="space-y-4">
              <AutonomyConsole />
            </TabsContent>

            <TabsContent value="seeds" className="space-y-4">
              <AdvancedSeedManager />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <ConfigurationPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
