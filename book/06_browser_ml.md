# Hoofdstuk 6: De Zintuigen - Browser ML

> *"Privacy is niet wat je belooft, maar wat je architectureel afdwingt."*

## 1. Het Privacy-First Principe

Browser ML betekent: **emotie-detectie zonder externe API calls**. Alle inferentie gebeurt lokaal via Transformers.js (Xenova/bert-base-multilingual-uncased-sentiment).

## 2. Technische Implementatie

```typescript
// Model loading (één keer bij startup)
const { pipeline } = await import('@huggingface/transformers');
const classifier = await pipeline('sentiment-analysis', 
  'Xenova/bert-base-multilingual-uncased-sentiment'
);

// Inference
const result = await classifier(input);
// → [{ label: 'negative', score: 0.89 }]
```

**Performance**: 50-150ms, geen API kosten, 100% privacy.

## 3. Gebruik in Decision Core

Browser ML boost in hybrid ranking (15% gewicht). Gebruikt als filter maar niet als finale beslissing.

**Vorige**: [H5 - Denklaag](05_decision_core.md) | **Volgende**: [H7 - Veiligheid](07_veiligheid_rubrics.md)
