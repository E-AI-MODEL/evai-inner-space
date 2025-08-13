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
        throw new Error(error.message || 'Python engine failed');
      }

      if (!data?.ok) {
        console.error('🔴 Python Engine response not ok:', data);
        throw new Error(data?.error || 'Python engine returned error');
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
      const { data, error } = await supabase.functions.invoke('python-transformer-engine', {
        body: { ping: true }
      });

      if (error || !data?.ok) {
        console.log('🔴 Python Engine ping failed');
        return false;
      }

      console.log('✅ Python Engine is online:', data);
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