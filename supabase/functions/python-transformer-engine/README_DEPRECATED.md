# ⚠️ DEPRECATED: Python Transformer Engine

**Status:** DEPRECATED as of Browser Transformers implementation  
**Replacement:** Browser-based ML using `@huggingface/transformers`

## Why Deprecated?

This Supabase Edge Function is **NO LONGER USED** in the production codebase. It has been replaced by a browser-based Machine Learning solution that offers:

✅ **Free** - No Hugging Face API costs  
✅ **Privacy** - All inference runs locally in the browser  
✅ **Offline** - Works without internet connection after model download  
✅ **Fast** - No network latency, direct GPU/WASM inference  

## Migration Status

| Component | Status | Notes |
|-----------|--------|-------|
| `useEmotionDetector.ts` | ✅ Migrated | Uses `useBrowserTransformerEngine` |
| `useUnifiedDecisionCore.ts` | ✅ Migrated | Browser ML pre-detection |
| `useSystemConnectivity.ts` | ✅ Migrated | No longer checks this endpoint |
| Admin UI | ✅ Migrated | Shows "Browser ML" instead |

## Rollback Instructions

If you need to re-enable this function:

1. **Update `useEmotionDetector.ts`:**
   ```typescript
   // Change line 9:
   import { usePythonTransformerEngine } from './usePythonTransformerEngine';
   
   // Change line 14:
   const { detectEmotion, isProcessing } = usePythonTransformerEngine();
   
   // Change lines 32-33:
   console.log('🐍 Layer 1: Invoking Python Transformer Engine...');
   const pythonResult = await detectEmotion(content, 'nl');
   ```

2. **Update `useSystemConnectivity.ts`:**
   ```typescript
   // Add back Hugging Face check (lines 53-66)
   ```

3. **Verify `HUGGING_FACE_ACCESS_TOKEN` secret is set in Supabase**

## Current Implementation

See `useBrowserTransformerEngine.ts` for the current implementation:
- Uses `@huggingface/transformers` v3+
- WebGPU acceleration with WASM fallback
- Model: `Xenova/bert-base-multilingual-uncased-sentiment`
- Sentiment → Emotion mapping for Dutch emotions

## Files to Keep

This folder and files are kept for:
- Historical reference
- Emergency rollback capability
- Documentation of the previous architecture

**DO NOT DELETE** without team discussion.

---

Last updated: 2025-10-25
