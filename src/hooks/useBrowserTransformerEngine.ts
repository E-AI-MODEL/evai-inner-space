/**
 * Browser-Based Transformer Engine v1.0
 * Uses @huggingface/transformers for client-side ML inference
 * - Multilingual emotion detection (Dutch + English)
 * - WebGPU acceleration (fallback to WASM)
 * - Model caching in browser storage
 * - No API keys required
 */

import { useState, useCallback, useRef } from 'react';
import { pipeline, env } from '@huggingface/transformers';
import { normalizeEmotion, isValidEmotion, type ValidEmotion } from '@/utils/seedValidator';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_NAME = 'Xenova/bert-base-multilingual-uncased-sentiment';

export interface BrowserEngineResult {
  emotion: string;
  confidence: number;
  allScores?: Array<{ label: string; score: number }>;
  device: 'webgpu' | 'wasm';
  inferenceTime: number;
}

export interface BrowserEngineResponse {
  ok: boolean;
  engine: 'browser-transformers';
  model: string;
  result: BrowserEngineResult;
  meta: {
    firstLoad: boolean;
    modelSize: string;
    device: 'webgpu' | 'wasm';
  };
}

// Sentiment to emotion mapping (5-star sentiment → Dutch emotions)
const SENTIMENT_TO_EMOTION: Record<string, ValidEmotion> = {
  '1 star': 'verdriet',
  '2 stars': 'teleurstelling', 
  '3 stars': 'onzekerheid',
  '4 stars': 'opluchting',
  '5 stars': 'blijdschap',
};

export function useBrowserTransformerEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lastResult, setLastResult] = useState<BrowserEngineResponse | null>(null);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  
  const pipelineRef = useRef<any>(null);
  const isInitializing = useRef(false);

  /**
   * Initialize the ML pipeline (lazy loading)
   */
  const initPipeline = useCallback(async (): Promise<any> => {
    if (pipelineRef.current) return pipelineRef.current;
    if (isInitializing.current) {
      // Wait for ongoing initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      return pipelineRef.current;
    }

    isInitializing.current = true;
    setIsModelLoading(true);
    setLoadingProgress(0);

    try {
      console.log('🧠 Browser Transformer: Initializing pipeline...');
      
      // Try WebGPU first
      try {
        setLoadingProgress(25);
        const webgpuPipe: any = await pipeline('text-classification', MODEL_NAME, {
          device: 'webgpu',
        });
        pipelineRef.current = webgpuPipe;
        setDevice('webgpu');
        console.log('✅ Browser Transformer: WebGPU enabled');
      } catch (webgpuError) {
        console.warn('⚠️ WebGPU not available, falling back to WASM:', webgpuError);
        setLoadingProgress(25);
        const wasmPipe: any = await pipeline('text-classification', MODEL_NAME, {
          device: 'wasm',
        });
        pipelineRef.current = wasmPipe;
        setDevice('wasm');
        console.log('✅ Browser Transformer: WASM enabled');
      }

      setLoadingProgress(100);
      setIsModelLoading(false);
      isInitializing.current = false;
      return pipelineRef.current;
    } catch (error) {
      console.error('❌ Browser Transformer: Pipeline initialization failed:', error);
      setIsModelLoading(false);
      isInitializing.current = false;
      pipelineRef.current = null;
      throw error;
    }
  }, []);

  /**
   * Detect emotion using browser-based ML
   */
  const detectEmotionInBrowser = useCallback(async (
    text: string,
    language: 'nl' | 'en' = 'nl'
  ): Promise<BrowserEngineResponse | null> => {
    if (!text || text.trim().length === 0) {
      console.warn('⚠️ Empty text provided to browser engine');
      return null;
    }

    setIsProcessing(true);
    const startTime = performance.now();
    const isFirstLoad = !pipelineRef.current;

    try {
      const pipe = await initPipeline();
      if (!pipe) {
        throw new Error('Failed to initialize pipeline');
      }

      console.log(`🔍 Browser Transformer: Analyzing "${text.substring(0, 50)}..."`);
      
      const results = await pipe(text, { top_k: 5 }) as any;
      const inferenceTime = performance.now() - startTime;

      if (!results || results.length === 0) {
        throw new Error('No results from pipeline');
      }

      // Get top prediction
      const topResult = Array.isArray(results) ? results[0] : results;
      const sentimentLabel = topResult.label;
      const confidence = topResult.score;

      // Map sentiment to emotion
      const emotion = SENTIMENT_TO_EMOTION[sentimentLabel] || 'onzekerheid';

      const allScores = Array.isArray(results) ? results.map((r: any) => ({
        label: SENTIMENT_TO_EMOTION[r.label] || r.label,
        score: r.score
      })) : [];

      const response: BrowserEngineResponse = {
        ok: true,
        engine: 'browser-transformers',
        model: MODEL_NAME,
        result: {
          emotion,
          confidence,
          allScores,
          device: device || 'wasm',
          inferenceTime: Math.round(inferenceTime),
        },
        meta: {
          firstLoad: isFirstLoad,
          modelSize: '~120MB',
          device: device || 'wasm',
        },
      };

      setLastResult(response);
      console.log(`✅ Browser Transformer: Detected "${emotion}" (${Math.round(confidence * 100)}% confidence, ${Math.round(inferenceTime)}ms)`);
      
      return response;
    } catch (error) {
      console.error('❌ Browser Transformer: Detection failed:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [initPipeline, device]);

  /**
   * Ping engine to check availability
   */
  const pingEngine = useCallback(async (): Promise<boolean> => {
    try {
      const result = await detectEmotionInBrowser('test', 'en');
      return result !== null;
    } catch {
      return false;
    }
  }, [detectEmotionInBrowser]);

  /**
   * Preload model in background
   */
  const preloadModel = useCallback(async (): Promise<void> => {
    if (pipelineRef.current || isInitializing.current) {
      console.log('⏭️ Browser Transformer: Model already loaded/loading');
      return;
    }

    console.log('🚀 Browser Transformer: Preloading model...');
    try {
      await initPipeline();
      console.log('✅ Browser Transformer: Preload complete');
    } catch (error) {
      console.warn('⚠️ Browser Transformer: Preload failed:', error);
    }
  }, [initPipeline]);

  return {
    detectEmotionInBrowser,
    pingEngine,
    preloadModel,
    isProcessing,
    isModelLoading,
    loadingProgress,
    lastResult,
    device,
    modelLoaded: !!pipelineRef.current,
  };
}
