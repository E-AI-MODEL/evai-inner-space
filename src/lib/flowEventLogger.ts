import { supabase } from '@/integrations/supabase/client';

export type FlowNodeName =
  | 'SAFETY_CHECK'
  | 'RUBRICS_EAA'
  | 'STRATEGIC_BRIEFING'
  | 'POLICY_DECISION'
  | 'SEMANTIC_GRAPH'
  | 'GENERATION'
  | 'VALIDATION_FUSION'
  | 'TD_MATRIX'
  | 'EAI_RULES'
  | 'NGBSE_CHECK'
  | 'HITL_CHECK'
  | 'AUTO_HEALING'
  | 'RESPONSE_GENERATION'
  | 'VALIDATION'
  | 'FUSION_ASSEMBLY'
  | 'FUSION_VALIDATION'
  | 'SEED_PRESERVATION_CHECK';

export async function logFlowEvent(
  sessionId: string,
  nodeName: FlowNodeName | string,
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped',
  processingTime?: number,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('processing_flow_events').insert({
      session_id: sessionId,
      node_name: nodeName,
      status,
      processing_time_ms: processingTime,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Failed to log flow event:', error);
  }
}
