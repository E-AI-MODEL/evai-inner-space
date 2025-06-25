
import { useState } from 'react';
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

  const searchUnifiedKnowledge = async (
    query: string,
    vectorApiKey?: string,
    maxResults: number = 10
  ): Promise<UnifiedKnowledgeItem[]> => {
    try {
      console.log('🔍 Searching unified knowledge for:', query.substring(0, 50));
      
      // Generate embedding if vector API key is available
      let queryEmbedding: number[] | null = null;
      if (vectorApiKey?.trim()) {
        try {
          queryEmbedding = await generateEmbedding(query, vectorApiKey);
        } catch (error) {
          console.warn('⚠️ Failed to generate embedding, continuing with text search only');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No authenticated user for knowledge search');
        return [];
      }

      // Call the unified search function
      const { data, error } = await supabase.rpc('search_unified_knowledge', {
        query_text: query,
        query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
        user_uuid: user.id,
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
    context?: {
      dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
      secondaryInsights?: string[];
    },
    history?: ChatHistoryItem[]
  ): Promise<DecisionResult | null> => {
    if (!input?.trim()) return null;

    setIsProcessing(true);
    console.log('🧠 Unified Decision Core processing:', input.substring(0, 50));

    try {
      // Step 1: Search unified knowledge base
      const knowledgeItems = await searchUnifiedKnowledge(input, vectorApiKey, 15);
      
      // Step 2: Analyze and rank knowledge sources
      const rankedSources = rankKnowledgeSources(knowledgeItems, input, context);
      
      // Step 3: Generate unified decision
      const decision = await generateUnifiedDecision(
        input, 
        rankedSources, 
        context, 
        history
      );

      // Step 4: Log decision for learning
      await logUnifiedDecision(input, rankedSources, decision);

      console.log('✅ Unified decision complete:', decision?.emotion);
      return decision;

    } catch (error) {
      console.error('🔴 Unified decision core error:', error);
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
        
        // Boost for exact emotion matches
        if (source.emotion && input.toLowerCase().includes(source.emotion.toLowerCase())) {
          score += 0.3;
        }
        
        // Boost for trigger word matches
        if (source.triggers?.some(trigger => 
          input.toLowerCase().includes(trigger.toLowerCase())
        )) {
          score += 0.2;
        }
        
        // Boost for similarity score
        if (source.similarity_score) {
          score += source.similarity_score * 0.3;
        }
        
        // Boost for usage count (popular responses)
        const usageCount = source.metadata?.usageCount || 0;
        score += Math.min(usageCount * 0.01, 0.1);
        
        // Apply context filters
        if (context?.dislikedLabel && source.metadata?.label === context.dislikedLabel) {
          score *= 0.3; // Reduce score for disliked labels
        }
        
        return { ...source, confidence_score: score };
      })
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5); // Top 5 sources
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

    // Determine response type based on content and context
    let label: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
    let responseType = bestSource.metadata?.type || 'validation';
    
    if (context?.dislikedLabel) {
      // Avoid disliked label, choose alternative
      if (context.dislikedLabel === "Valideren") label = "Reflectievraag";
      else if (context.dislikedLabel === "Reflectievraag") label = "Suggestie";
      else label = "Valideren";
    } else {
      // Map response type to label
      switch (responseType) {
        case 'reflection': label = "Reflectievraag"; break;
        case 'suggestion': label = "Suggestie"; break;
        default: label = "Valideren"; break;
      }
    }

    // Create reasoning
    const reasoning = [
      `Hoofdbron: ${bestSource.emotion} (vertrouwen: ${Math.round(bestSource.confidence_score * 100)}%)`,
      otherSources.length > 0 ? `Ondersteunende bronnen: ${otherSources.map(s => s.emotion).join(', ')}` : '',
      `Type response: ${label} gebaseerd op ${responseType}`,
      context?.dislikedLabel ? `Vermeden label: ${context.dislikedLabel}` : ''
    ].filter(Boolean).join('. ');

    // Create symbolic inferences
    const symbolicInferences = [
      `🎯 Hoofdemotie: ${bestSource.emotion}`,
      `📊 Vertrouwen: ${Math.round(bestSource.confidence_score * 100)}%`,
      `🔗 Bronnen: ${sources.length} gevonden`,
      `💡 Type: ${label}`,
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
      meta: `Unified Decision Core: ${sources.length} bronnen geanalyseerd`
    };
  };

  const logUnifiedDecision = async (
    input: string,
    sources: UnifiedKnowledgeItem[],
    decision: DecisionResult | null
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !decision) return;

      await supabase.rpc('log_hybrid_decision', {
        p_user_id: user.id,
        p_user_input: input,
        p_symbolic_matches: sources.filter(s => s.content_type === 'seed'),
        p_neural_similarities: sources.filter(s => s.content_type === 'embedding'),
        p_hybrid_decision: {
          method: 'unified_core',
          emotion: decision.emotion,
          confidence: decision.confidence,
          sources_count: sources.length
        },
        p_final_response: decision.response,
        p_confidence_score: decision.confidence
      });

      console.log('📝 Unified decision logged successfully');
    } catch (error) {
      console.error('❌ Failed to log unified decision:', error);
    }
  };

  const consolidateKnowledge = async (): Promise<boolean> => {
    try {
      console.log('🔄 Starting knowledge consolidation...');
      
      const { error } = await supabase.rpc('consolidate_knowledge');
      
      if (error) {
        console.error('❌ Knowledge consolidation failed:', error);
        return false;
      }
      
      console.log('✅ Knowledge consolidation completed');
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
    isProcessing
  };
}
