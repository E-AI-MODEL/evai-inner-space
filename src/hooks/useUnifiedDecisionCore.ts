
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateEmbedding } from '../lib/embeddingUtils';
import { EmotionDetection } from './useOpenAI';
import { ChatHistoryItem } from '../types';

export interface UnifiedKnowledgeItem {
  id: string;
  content_type: 'seed' | 'embedding' | 'pattern' | 'insight';
  emotion: string;
  triggers?: string[];
  response_text?: string;
  confidence_score: number;
  similarity_score?: number;
  metadata: Record<string, any>;
}

export interface DecisionResult {
  emotion: string;
  response: string;
  confidence: number;
  reasoning: string;
  sources: UnifiedKnowledgeItem[];
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  symbolicInferences: string[];
  meta: string;
}

export function useUnifiedDecisionCore() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [knowledgeStats, setKnowledgeStats] = useState({
    total: 0,
    seeds: 0,
    embeddings: 0,
    patterns: 0,
    insights: 0
  });

  useEffect(() => {
    console.log('🚀 UnifiedDecisionCore v2.0 initializing...');
    loadKnowledgeStats();
  }, []);

  const loadKnowledgeStats = async () => {
    try {
      console.log('📊 Loading unified knowledge stats...');
      
      const { data, error } = await supabase
        .from('unified_knowledge')
        .select('content_type, active')
        .eq('user_id', '00000000-0000-0000-0000-000000000001')
        .eq('active', true);

      if (error) {
        console.error('❌ Failed to load knowledge stats:', error);
        return;
      }

      const stats = data.reduce((acc, item) => {
        acc.total++;
        if (item.content_type === 'seed') acc.seeds++;
        else if (item.content_type === 'embedding') acc.embeddings++;
        else if (item.content_type === 'pattern') acc.patterns++;
        else if (item.content_type === 'insight') acc.insights++;
        return acc;
      }, { total: 0, seeds: 0, embeddings: 0, patterns: 0, insights: 0 });

      console.log('📊 Knowledge stats loaded:', stats);
      setKnowledgeStats(stats);
    } catch (error) {
      console.error('🔴 Error loading knowledge stats:', error);
    }
  };

  const autoConsolidateIfNeeded = async (): Promise<boolean> => {
    try {
      if (knowledgeStats.total === 0) {
        console.log('🔄 No unified knowledge found, attempting auto-consolidation...');
        
        const { data: legacySeeds, error: seedError } = await supabase
          .from('emotion_seeds')
          .select('id')
          .eq('active', true)
          .limit(1);

        if (seedError) {
          console.error('❌ Error checking legacy seeds:', seedError);
          return false;
        }

        if (legacySeeds && legacySeeds.length > 0) {
          console.log('🚀 Found legacy seeds, triggering consolidation...');
          const success = await consolidateKnowledge();
          if (success) {
            await loadKnowledgeStats();
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('🔴 Auto-consolidation error:', error);
      return false;
    }
  };

  const searchUnifiedKnowledge = async (
    query: string,
    vectorApiKey?: string,
    maxResults: number = 10
  ): Promise<UnifiedKnowledgeItem[]> => {
    try {
      console.log('🔍 Searching unified knowledge v2.0 for:', query.substring(0, 50));
      
      await autoConsolidateIfNeeded();
      
      let queryEmbedding: number[] | null = null;
      if (vectorApiKey?.trim()) {
        try {
          queryEmbedding = await generateEmbedding(query, vectorApiKey);
        } catch (error) {
          console.warn('⚠️ Failed to generate embedding, continuing with text search only');
        }
      }

      const { data, error } = await supabase.rpc('search_unified_knowledge', {
        query_text: query,
        query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
        similarity_threshold: 0.7,
        max_results: maxResults
      });

      if (error) {
        console.error('❌ Unified knowledge search error:', error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} unified knowledge items`);
      return (data || []).map((item: any) => ({
        id: item.id,
        content_type: item.content_type,
        emotion: item.emotion,
        triggers: item.metadata?.triggers || [],
        response_text: item.response_text,
        confidence_score: item.confidence_score,
        similarity_score: item.similarity_score,
        metadata: item.metadata || {}
      }));

    } catch (error) {
      console.error('🔴 Unified knowledge search failed:', error);
      return [];
    }
  };

  const makeUnifiedDecision = async (
    input: string,
    apiKey?: string,
    vectorApiKey?: string,
    googleApiKey?: string,
    context?: {
      dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
      secondaryInsights?: string[];
    },
    history?: ChatHistoryItem[]
  ): Promise<DecisionResult | null> => {
    console.log('🧠 makeUnifiedDecision v2.0 called with input:', input.substring(0, 50) + '...');
    console.log('🔑 API keys provided - primary:', !!apiKey, 'vector:', !!vectorApiKey, 'google:', !!googleApiKey);
    
    if (!input?.trim()) {
      console.log('❌ Empty input provided to makeUnifiedDecision');
      return null;
    }

    setIsProcessing(true);
    console.log('🧠 Unified Decision Core v2.0 processing:', input.substring(0, 50));

    try {
      const knowledgeItems = await searchUnifiedKnowledge(input, vectorApiKey, 15);
      const rankedSources = rankKnowledgeSources(knowledgeItems, input, context);
      const decision = await generateUnifiedDecision(input, rankedSources, context, history);

      // Log decision with v2.0 metadata
      await logUnifiedDecision(input, rankedSources, decision, {
        googleApiUsed: !!googleApiKey,
        version: '2.0'
      });

      console.log('✅ Unified decision v2.0 complete:', decision?.emotion);
      return decision;

    } catch (error) {
      console.error('🔴 Unified decision core v2.0 error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const rankKnowledgeSources = (
    sources: UnifiedKnowledgeItem[],
    input: string,
    context?: any
  ): UnifiedKnowledgeItem[] => {
    return sources
      .map(source => {
        let score = source.confidence_score || 0;
        
        if (source.emotion && input.toLowerCase().includes(source.emotion.toLowerCase())) {
          score += 0.3;
        }
        
        if (source.triggers?.some(trigger => 
          input.toLowerCase().includes(trigger.toLowerCase())
        )) {
          score += 0.2;
        }
        
        if (source.similarity_score) {
          score += source.similarity_score * 0.3;
        }
        
        const usageCount = source.metadata?.usageCount || 0;
        score += Math.min(usageCount * 0.01, 0.1);
        
        if (context?.dislikedLabel && source.metadata?.label === context.dislikedLabel) {
          score *= 0.3;
        }
        
        return { ...source, confidence_score: score };
      })
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5);
  };

  const generateUnifiedDecision = async (
    input: string,
    sources: UnifiedKnowledgeItem[],
    context?: any,
    history?: ChatHistoryItem[]
  ): Promise<DecisionResult | null> => {
    if (sources.length === 0) {
      return null;
    }

    const bestSource = sources[0];
    const otherSources = sources.slice(1, 3);

    let label: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
    let responseType = bestSource.metadata?.type || 'validation';
    
    if (context?.dislikedLabel) {
      if (context.dislikedLabel === "Valideren") label = "Reflectievraag";
      else if (context.dislikedLabel === "Reflectievraag") label = "Suggestie";
      else label = "Valideren";
    } else {
      switch (responseType) {
        case 'reflection': label = "Reflectievraag"; break;
        case 'suggestion': label = "Suggestie"; break;
        default: label = "Valideren"; break;
      }
    }

    const reasoning = [
      `Hoofdbron: ${bestSource.emotion} (vertrouwen: ${Math.round(bestSource.confidence_score * 100)}%)`,
      otherSources.length > 0 ? `Ondersteunende bronnen: ${otherSources.map(s => s.emotion).join(', ')}` : '',
      `Type response: ${label} gebaseerd op ${responseType}`,
      context?.dislikedLabel ? `Vermeden label: ${context.dislikedLabel}` : ''
    ].filter(Boolean).join('. ');

    const symbolicInferences = [
      `🎯 Hoofdemotie: ${bestSource.emotion}`,
      `📊 Vertrouwen: ${Math.round(bestSource.confidence_score * 100)}%`,
      `🔗 Bronnen: ${sources.length} gevonden`,
      `💡 Type: ${label}`,
      `🚀 EvAI v2.0 Enhanced`,
      ...sources.slice(0, 2).map(s => `• ${s.emotion} (${Math.round(s.confidence_score * 100)}%)`)
    ];

    return {
      emotion: bestSource.emotion,
      response: bestSource.response_text || 'Ik begrijp hoe je je voelt.',
      confidence: bestSource.confidence_score,
      reasoning,
      sources,
      label,
      symbolicInferences,
      meta: `Unified Decision Core v2.0: ${sources.length} bronnen geanalyseerd`
    };
  };

  const logUnifiedDecision = async (
    input: string,
    sources: UnifiedKnowledgeItem[],
    decision: DecisionResult | null,
    metadata: { googleApiUsed?: boolean; version?: string } = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !decision) return;

      const symbolicMatches = sources
        .filter(s => s.content_type === 'seed')
        .map(s => ({
          id: s.id,
          emotion: s.emotion,
          confidence: s.confidence_score,
          type: s.content_type
        }));

      const neuralSimilarities = sources
        .filter(s => s.content_type === 'embedding')
        .map(s => ({
          id: s.id,
          emotion: s.emotion,
          similarity: s.similarity_score || 0,
          type: s.content_type
        }));

      // Log with enhanced v2.0 metadata
      const apiCollaboration = {
        api1Used: true,
        api2Used: false,
        vectorApiUsed: sources.some(s => s.similarity_score),
        googleApiUsed: metadata.googleApiUsed || false,
        version: metadata.version || '2.0'
      };

      await supabase.rpc('log_evai_workflow', {
        p_conversation_id: 'unified-decision-' + Date.now(),
        p_workflow_type: 'unified_decision_v2',
        p_api_collaboration: apiCollaboration,
        p_success: true,
        p_processing_time: 0
      });

      console.log('📝 Unified decision v2.0 logged successfully');
    } catch (error) {
      console.error('❌ Failed to log unified decision:', error);
    }
  };

  const consolidateKnowledge = async (): Promise<boolean> => {
    try {
      console.log('🔄 Starting knowledge consolidation v2.0...');
      
      const { error } = await supabase.rpc('consolidate_knowledge');
      
      if (error) {
        console.error('❌ Knowledge consolidation failed:', error);
        return false;
      }
      
      console.log('✅ Knowledge consolidation v2.0 completed');
      await loadKnowledgeStats();
      return true;
    } catch (error) {
      console.error('🔴 Knowledge consolidation error:', error);
      return false;
    }
  };

  return {
    makeUnifiedDecision,
    searchUnifiedKnowledge,
    consolidateKnowledge,
    loadKnowledgeStats,
    knowledgeStats,
    isProcessing
  };
}
