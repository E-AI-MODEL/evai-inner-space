/**
 * ⚠️ DEPRECATED: Python Transformer Engine Hook
 * 
 * This hook is DEPRECATED and replaced by useBrowserTransformerEngine.
 * 
 * DO NOT USE for new features. This is kept for:
 * - Backward compatibility
 * - Rollback option if Browser ML fails
 * 
 * Migration path:
 * - Old: import { usePythonTransformerEngine } from './usePythonTransformerEngine'
 * - New: import { useBrowserTransformerEngine } from './useBrowserTransformerEngine'
 * 
 * Browser ML benefits over Python API:
 * ✅ Free (no API costs)
 * ✅ Privacy (local inference)
 * ✅ Offline (works without internet after model download)
 * ✅ Fast (no network latency)
 * 
 * @deprecated Use useBrowserTransformerEngine instead
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PythonEngineResult {
  sentiment?: string;
  emotion?: string;
  classification?: string;
  entities?: Array<{
    text: string;
    label: string;
    confidence: number;
    start: number;
    end: number;
  }>;
  confidence: number;
  [key: string]: any;
}

export interface PythonEngineResponse {
  ok: boolean;
  engine: string;
  task: string;
  model: string;
  result: PythonEngineResult;
  meta: {
    processingTime: number;
    language: string;
    inputLength: number;
    version: string;
  };
}

export function usePythonTransformerEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<PythonEngineResponse | null>(null);

  const processWithPythonEngine = async (
    text: string,
    task: 'sentiment-analysis' | 'emotion-detection' | 'text-classification' | 'ner' = 'sentiment-analysis',
    language: 'nl' | 'en' = 'nl'
  ): Promise<PythonEngineResponse | null> => {
    if (!text?.trim()) {
      console.log('🐍 Python Engine: Empty text provided');
      return null;
    }

    setIsProcessing(true);
    console.log(`🐍 Python Transformer Engine: ${task} for "${text.substring(0, 50)}..."`);

    try {
      const { data, error } = await supabase.functions.invoke('python-transformer-engine', {
        body: {
          text: text.substring(0, 1000), // Limit input length
          task,
          language
        }
      });

      if (error) {
        console.error('🔴 Python Engine error:', error);
        const errorMsg = error.message || 'Python engine edge function failed';
        throw new Error(`${errorMsg} - Check Supabase Edge Function logs for details`);
      }

      if (!data?.ok) {
        console.error('🔴 Python Engine response not ok:', data);
        const details = data?.details ? ` (${data.details})` : '';
        const recommendations = data?.recommendations?.length 
          ? ` Suggestions: ${data.recommendations.join('; ')}` 
          : ' Check Hugging Face API configuration';
        throw new Error(`${data?.error || 'Python engine processing failed'}${details}.${recommendations}`);
      }

      const result = data as PythonEngineResponse;
      setLastResult(result);
      
      console.log(`✅ Python Engine success: ${result.task} completed in ${result.meta.processingTime}ms`);
      console.log('🧠 Result:', result.result);
      
      return result;

    } catch (error) {
      console.error('🔴 Python Transformer Engine failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeSentiment = async (text: string, language: 'nl' | 'en' = 'nl') => {
    return await processWithPythonEngine(text, 'sentiment-analysis', language);
  };

  const detectEmotion = async (text: string, language: 'nl' | 'en' = 'nl') => {
    return await processWithPythonEngine(text, 'emotion-detection', language);
  };

  const classifyText = async (text: string, language: 'nl' | 'en' = 'nl') => {
    return await processWithPythonEngine(text, 'text-classification', language);
  };

  const extractEntities = async (text: string, language: 'nl' | 'en' = 'nl') => {
    return await processWithPythonEngine(text, 'ner', language);
  };

  const pingEngine = async (): Promise<boolean> => {
    try {
      console.log('🐍 Pinging Python Engine with real test...');
      
      // Perform REAL test call to verify Hugging Face API works
      const { data, error } = await supabase.functions.invoke('python-transformer-engine', {
        body: { 
          text: 'This is a test sentence for sentiment analysis.', 
          task: 'sentiment-analysis',
          language: 'en'
        }
      });

      if (error) {
        console.log('🔴 Python Engine ping failed (Edge Function error):', error);
        return false;
      }

      if (!(data as any)?.ok) {
        console.log('🔴 Python Engine ping failed (response not ok):', data);
        return false;
      }

      // Check if result contains expected sentiment data
      const result = (data as any)?.result;
      if (!result || !result.sentiment) {
        console.log('🔴 Python Engine ping failed (no sentiment in result):', result);
        return false;
      }

      console.log('✅ Python Engine is online with Hugging Face API working');
      return true;
    } catch (error) {
      console.error('🔴 Python Engine ping error:', error);
      return false;
    }
  };

  return {
    processWithPythonEngine,
    analyzeSentiment,
    detectEmotion,
    classifyText,
    extractEntities,
    pingEngine,
    isProcessing,
    lastResult
  };
}