/**
 * EvAI Admin Intelligence Dashboard v16
 * Unified dashboard with three layers:
 * 1. Symbolische Controle (symbolic control - rules, seeds, constraints)
 * 2. Neurale Samenwerking (neural collaboration - LLM integration)
 * 3. Audit & Debug (audit trail and diagnostics)
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Section } from '@/components/admin/Section';
import { MetricGrid } from '@/components/admin/MetricGrid';
import { DecisionLogTable } from '@/components/admin/DecisionLogTable';
import { SeedCoherencePanel } from '@/components/admin/SeedCoherencePanel';
import { TemplateParameterDocs } from '@/components/admin/TemplateParameterDocs';
import AdvancedSeedManager from '@/components/admin/AdvancedSeedManager';
import ConfigurationPanel from '@/components/admin/ConfigurationPanel';
import { useNavigate } from 'react-router-dom';
import { useSystemConnectivity } from '@/hooks/useSystemConnectivity';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ANONYMOUS_SUPER_USER, useAuth } from '../hooks/useAuth';
import AdminAuth from '@/components/admin/AdminAuth';
import { LogOut, Trash2, Shield, Brain, FileText, Activity } from 'lucide-react';
import { getAuditStats, getDecisionLogs } from '@/services/AuditService';

const AdminDashboard = () => {
  const { isAdminAuthorized, authorizeAdmin, logoutAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'autonomy' | 'seeds' | 'settings'>('autonomy');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { status: connectivity, refresh: refreshConnectivity } = useSystemConnectivity();

  // Fetch audit statistics
  const { data: auditStats, refetch: refetchStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => getAuditStats(ANONYMOUS_SUPER_USER.id, 200),
    refetchInterval: 15000, // Update every 15 seconds
  });

  // Fetch decision logs
  const { data: decisionLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['decision-logs'],
    queryFn: async () => getDecisionLogs(ANONYMOUS_SUPER_USER.id, 50),
    refetchInterval: 15000,
  });

  // Database cleanup
  const handleConsolidateKnowledge = async () => {
    setIsConsolidating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('evai-admin', {
        body: { operation: 'consolidate-knowledge' }
      });
      
      if (error) throw error;
      
      toast({
        title: '✅ Database Cleanup Successful',
        description: data?.cleanup 
          ? `Removed ${data.cleanup[0]} invalid seeds, ${data.cleanup[1]} invalid knowledge entries`
          : 'Knowledge base consolidated',
      });
      
      await Promise.all([refreshConnectivity(), refetchStats(), refetchLogs()]);
      
    } catch (error) {
      console.error('Consolidation error:', error);
      toast({
        title: '❌ Cleanup Failed',
        description: error instanceof Error ? error.message : 'Failed to clean database',
        variant: 'destructive',
      });
    } finally {
      setIsConsolidating(false);
    }
  };

  // Run diagnostics
  const [diagnosticsResult, setDiagnosticsResult] = useState<string>('');
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    let result = '🔍 Running system diagnostics...\n\n';

    try {
      result += '📋 ARCHITECTURE:\n';
      result += '• Server-Side (Production) ✅\n';
      result += '• Security: Edge Functions ✅\n\n';

      result += '🧪 EDGE FUNCTIONS:\n';
      
      // Test chat
      const chatStart = Date.now();
      const { data: chatData, error: chatError } = await supabase.functions.invoke('evai-core', {
        body: { 
          operation: 'chat',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        }
      });
      const chatTime = Date.now() - chatStart;
      result += `• evai-core (chat): ${chatError ? '❌' : '✅'} (${chatTime}ms)\n`;

      // Test embedding
      const embStart = Date.now();
      const { data: embData, error: embError } = await supabase.functions.invoke('evai-core', {
        body: { 
          operation: 'embedding',
          input: 'test',
          model: 'text-embedding-3-small'
        }
      });
      const embTime = Date.now() - embStart;
      result += `• evai-core (embedding): ${embError ? '❌' : '✅'} (${embTime}ms)\n\n`;

      result += '🌐 NETWORK:\n';
      result += `• Online: ${navigator.onLine ? '✅' : '❌'}\n`;
      result += `• Connection: ${(navigator as any).connection?.effectiveType || 'unknown'}\n\n`;
      result += '✅ Diagnostics completed!';

    } catch (error) {
      result += `\n❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`;
    } finally {
      setDiagnosticsResult(result);
      setIsRunningDiagnostics(false);
    }
  };

  // Auth guard
  if (!isAdminAuthorized) {
    return <AdminAuth onAuthenticated={authorizeAdmin} />;
  }

  // Calculate safety index
  const safetyIndex = auditStats 
    ? (100 - (auditStats.constraintsBlocked / Math.max(1, auditStats.totalDecisions)) * 100).toFixed(1)
    : '0';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                EvAI Admin Intelligence Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Neurosymbolisch AI systeem • v16 • Safety Index: {safetyIndex}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleConsolidateKnowledge}
                disabled={isConsolidating}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isConsolidating ? 'Cleaning...' : 'Clean DB'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  logoutAdmin();
                  toast({ title: "Logged out", description: "Admin session ended" });
                }}
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="autonomy">Intelligence Overview</TabsTrigger>
              <TabsTrigger value="seeds">Seed Management</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            {/* AUTONOMY TAB */}
            <TabsContent value="autonomy" className="space-y-6">
              
              {/* 1. SYMBOLISCHE CONTROLE */}
              <Section 
                title="🛡️ Symbolische Controle" 
                subtitle="Regelgebaseerde beslissingen, kennis en veiligheidsconstraints"
                variant="symbolic"
              >
                <MetricGrid 
                  metrics={[
                    {
                      label: 'Symbolische dekking',
                      value: `${auditStats?.seedCoverage.toFixed(1) || 0}%`,
                      tooltip: 'Percentage beslissingen op basis van rubrics of seeds zonder LLM',
                      icon: <Shield className="h-4 w-4 text-green-600" />
                    },
                    {
                      label: 'Toegepaste regels',
                      value: auditStats?.policyHits || 0,
                      tooltip: 'Aantal keer dat decision.policy actief was',
                      icon: <FileText className="h-4 w-4 text-green-600" />
                    },
                    {
                      label: 'Voorkomen overtredingen',
                      value: auditStats?.constraintsBlocked || 0,
                      tooltip: 'Plannen gestopt door Z3 constraint layer',
                      icon: <Activity className="h-4 w-4 text-green-600" />
                    },
                    {
                      label: 'Veiligheidsindex',
                      value: `${safetyIndex}%`,
                      tooltip: '100 - (blocked% × 100) - hogere score = veiliger systeem',
                      icon: <Shield className="h-4 w-4 text-green-600" />
                    }
                  ]}
                />
              </Section>

              {/* 2. NEURALE SAMENWERKING */}
              <Section 
                title="🧠 Neurale Samenwerking" 
                subtitle="LLM wordt alleen ingezet voor creatieve planning binnen constraints"
                variant="neural"
              >
                <MetricGrid 
                  metrics={[
                    {
                      label: 'GPT-calls per sessie',
                      value: auditStats 
                        ? (auditStats.totalLLMCalls / Math.max(1, auditStats.sessions)).toFixed(1)
                        : '0',
                      tooltip: 'Hoe vaak de LLM wordt ingeschakeld per gebruikerssessie',
                      icon: <Brain className="h-4 w-4 text-blue-600" />
                    },
                    {
                      label: 'LLM-bypass ratio',
                      value: `${auditStats?.llmBypassRatio.toFixed(1) || 0}%`,
                      tooltip: 'Percentage beslissingen zonder OpenAI - hogere score = efficiënter',
                      icon: <Activity className="h-4 w-4 text-blue-600" />
                    },
                    {
                      label: 'Gemiddelde reactietijd',
                      value: `${auditStats?.avgResponseTime || 0}ms`,
                      tooltip: 'Snelheid van de orkestratie pipeline',
                      icon: <Activity className="h-4 w-4 text-blue-600" />
                    },
                    {
                      label: 'Totaal beslissingen',
                      value: auditStats?.totalDecisions || 0,
                      tooltip: 'Totaal aantal verwerkte beslissingen in deze periode',
                      icon: <FileText className="h-4 w-4 text-blue-600" />
                    }
                  ]}
                />
              </Section>

              {/* 3. AUDIT & DEBUG */}
              <Section 
                title="🔍 Audit & Debug" 
                subtitle="Technische controle, beslislogs en reproduceerbare sessies"
                variant="audit"
              >
                <Tabs defaultValue="logs" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="logs">Decision Logs</TabsTrigger>
                    <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="logs">
                    <DecisionLogTable logs={decisionLogs || []} isLoading={logsLoading} />
                  </TabsContent>

                  <TabsContent value="diagnostics">
                    <div className="space-y-4">
                      <Button 
                        onClick={runDiagnostics}
                        disabled={isRunningDiagnostics}
                        className="w-full"
                      >
                        {isRunningDiagnostics ? 'Running...' : 'Run Full Diagnostics'}
                      </Button>
                      
                      {diagnosticsResult && (
                        <div className="bg-slate-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
                          <pre className="whitespace-pre-wrap">{diagnosticsResult}</pre>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </Section>
            </TabsContent>

            {/* SEEDS TAB */}
            <TabsContent value="seeds" className="space-y-6">
              <AdvancedSeedManager />
              
              {/* Template Parameter Documentation */}
              <Section 
                title="📖 Template Parameters" 
                subtitle="Beschikbare parameters voor dynamische seed responses"
                variant="neural"
              >
                <TemplateParameterDocs />
              </Section>
              
              {/* Seed Coherence & Cleanup Section */}
              <Section 
                title="🔧 Seed Coherence & Cleanup" 
                subtitle="Database cleaning en template validation"
                variant="audit"
              >
                <SeedCoherencePanel />
              </Section>
            </TabsContent>

            {/* SETTINGS TAB */}
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
