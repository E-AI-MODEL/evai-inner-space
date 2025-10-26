# Hoofdstuk 5: De Denklaag - Unified Decision Core

> *"De vraag is niet 'Wat denkt de AI?' maar 'Hoe beslist de AI en waarom?'"*

---

## 1. Het Hart van het Systeem

Als EvAI een brein is, dan is `useUnifiedDecisionCore` de **prefrontale cortex**: de plek waar alle informatie samenkomt en een besluit wordt gemaakt.

Deze hook orkestreert:
- Zoeken in 3 kennisbronnen (symbolisch, semantisch, neuraal)
- Ranken van kandidaten
- Genereren van finale response
- Logging van het hele proces

**Locatie**: `src/hooks/useUnifiedDecisionCore.ts`  
**Regels**: 418 lines  
**Complexiteit**: Hoog (maar uitlegbaar!)

---

## 2. De Functie Signature

```typescript
async function makeUnifiedDecision(
  input: string,
  apiKey?: string,
  vectorApiKey?: string,
  googleApiKey?: string,
  strategicBriefing?: StrategicBriefing,
  history?: ChatHistoryItem[]
): Promise<DecisionResult>
```

### Parameters

| Naam | Type | Doel |
|------|------|------|
| `input` | `string` | User message ("Ik voel me angstig") |
| `apiKey` | `string?` | OpenAI key (GPT fallback) |
| `vectorApiKey` | `string?` | OpenAI key (embeddings) |
| `googleApiKey` | `string?` | Future: Gemini integration |
| `strategicBriefing` | `StrategicBriefing?` | Context van Layer 3 (rubrics) |
| `history` | `ChatHistoryItem[]?` | Conversatiegeschiedenis |

### Return Type

```typescript
interface DecisionResult {
  emotion: string;           // Gedetecteerde emotie
  response: string;          // Finale response
  confidence: number;        // 0.0 - 1.0
  reasoning: string;         // Waarom deze keuze?
  sources: UnifiedKnowledgeItem[];  // Gebruikte kennis
  label: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout';
  symbolicInferences: string[];  // Symbolische matches
}
```

---

## 3. De Decision Pipeline (Step-by-Step)

### Step 1: Browser ML Emotion Pre-Detection

```typescript
// Lokale emotie-detectie (Layer 4)
const { detectEmotion } = useBrowserTransformerEngine();
const browserMLResult = await detectEmotion(input);

console.log('🧠 Browser ML:', browserMLResult);
// → { emotion: 'negative', score: 0.89, label: 'sad' }
```

**Waarom eerst?**

Dit is **gratis** (client-side) en **snel** (50-150ms). Als het vertrouwen hoog genoeg is (> 0.7), gebruiken we het als filter voor de kennissearch.

---

### Step 2: Search Unified Knowledge

```typescript
const knowledgeItems = await searchUnifiedKnowledge(
  input,
  vectorApiKey,
  10  // max results
);
```

#### 2a. Text-Based Search (Symbolic)

```typescript
// In Supabase function
const { data: textResults } = await supabase
  .from('unified_knowledge')
  .select('*')
  .or(`emotion.ilike.%${queryWords}%,response_text.ilike.%${queryWords}%`)
  .eq('active', true)
  .eq('user_id', ANONYMOUS_USER_ID)
  .order('usage_count', { ascending: false })
  .limit(5);
```

**Output Example**:
```json
[
  {
    "id": "seed-123",
    "content_type": "seed",
    "emotion": "angst",
    "response_text": "Het is begrijpelijk dat je je angstig voelt...",
    "confidence_score": 0.85,
    "triggers": ["onzekerheid", "spanning"]
  }
]
```

---

#### 2b. Vector-Based Search (Semantic)

```typescript
// Generate embedding via Edge Function
const embedding = await generateEmbedding(input, vectorApiKey);

// Search similar vectors
const { data: vectorResults } = await supabase.rpc('search_unified_knowledge', {
  query_text: input,
  query_embedding: embedding,
  similarity_threshold: 0.7,
  max_results: 10
});
```

**Voorbeeld**:

**Query**: "Ik ben bang voor de toekomst"

**Embedding**: `[0.023, -0.145, 0.891, ..., 0.234]` (1536 dimensies)

**Results**:
```json
[
  {
    "emotion": "angst",
    "response_text": "Het is normaal om onzeker te zijn over wat komt...",
    "similarity_score": 0.83
  },
  {
    "emotion": "onzekerheid",
    "response_text": "Onbekendheid kan spannend maar ook eng zijn...",
    "similarity_score": 0.79
  }
]
```

**Hoe Similarity Werkt**:

Cosine similarity tussen twee vectors:
```
similarity = 1 - (vector1 <=> vector2)

waarbij <=> = cosine distance operator in pgvector
```

**0.83 betekent**: 83% semantische overlap tussen query en stored embedding.

---

#### 2c. Neural Fallback (GPT)

```typescript
if (textResults.length + vectorResults.length < 3) {
  console.log('⚠️ Low knowledge → GPT fallback');
  
  const gptResponse = await supabase.functions.invoke('evai-core', {
    body: {
      operation: 'chat',
      messages: [
        {
          role: 'system',
          content: `Je bent een empathische therapeutische assistent.
                    Reageer op de emotie van de gebruiker met validatie.
                    Geef concreet advies waar mogelijk.
                    Context: ${JSON.stringify(strategicBriefing)}`
        },
        { role: 'user', content: input }
      ]
    }
  });
  
  knowledgeItems.push({
    content_type: 'gpt',
    response_text: gptResponse.data.content,
    confidence_score: 0.65,  // Medium confidence (geen seed match)
    emotion: 'neutral',
    metadata: { source: 'gpt-4o-mini', fallback: true }
  });
}
```

**Wanneer triggert dit?**

- Nieuwe emoties (niet in seeds)
- Complex multi-emotie input
- Edge cases (sarcasme, metaforen)

**Trade-off**: GPT geeft **altijd** een antwoord, maar is minder uitlegbaar en duurder.

---

### Step 3: Rank Knowledge Sources

```typescript
const rankedSources = rankKnowledgeSources(
  knowledgeItems,
  input,
  browserMLResult,
  strategicBriefing
);
```

#### Ranking Algoritme

```typescript
function rankKnowledgeSources(
  sources: UnifiedKnowledgeItem[],
  userInput: string,
  browserML: BrowserMLResult,
  briefing: StrategicBriefing
): ScoredSource[] {
  
  return sources.map(source => {
    // 1. Symbolic score (keyword matching)
    const symbolicScore = calculateSymbolicMatch(source, userInput);
    
    // 2. Semantic score (vector similarity)
    const semanticScore = source.similarity_score || 0;
    
    // 3. Browser ML boost
    const browserMLBoost = calculateEmotionAlignment(source.emotion, browserML.label);
    
    // 4. Rubrics relevance
    const rubricsScore = calculateRubricsRelevance(source, briefing);
    
    // Weighted combination
    const finalScore = 
      0.30 * symbolicScore +
      0.35 * semanticScore +
      0.15 * browserMLBoost +
      0.20 * rubricsScore;
    
    return {
      ...source,
      scores: { symbolicScore, semanticScore, browserMLBoost, rubricsScore },
      finalScore
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}
```

---

#### Score Component Details

**1. Symbolic Score (Keyword Match)**:
```typescript
function calculateSymbolicMatch(source: Source, input: string): number {
  const inputWords = input.toLowerCase().split(/\s+/);
  const triggers = source.triggers || [];
  
  let matchCount = 0;
  for (const trigger of triggers) {
    if (inputWords.some(word => word.includes(trigger.toLowerCase()))) {
      matchCount++;
    }
  }
  
  return Math.min(1.0, matchCount / Math.max(1, triggers.length));
}
```

**Voorbeeld**:
- Input: "Ik voel me angstig en onzeker"
- Triggers: ["angst", "onzekerheid", "spanning"]
- Matches: "angstig" ≈ "angst", "onzeker" ≈ "onzekerheid"
- Score: 2/3 = **0.67**

---

**2. Emotion Alignment (Browser ML Boost)**:
```typescript
function calculateEmotionAlignment(
  sourceEmotion: string,
  browserMLLabel: string
): number {
  const negativeEmotions = ['angst', 'verdriet', 'woede', 'stress', 'eenzaamheid'];
  const positiveEmotions = ['blijdschap', 'trots', 'vreugde', 'rust'];
  
  if (browserMLLabel === 'negative' && negativeEmotions.includes(sourceEmotion)) {
    return 0.8;
  }
  if (browserMLLabel === 'positive' && positiveEmotions.includes(sourceEmotion)) {
    return 0.8;
  }
  
  return 0.5;  // Neutral / no clear alignment
}
```

---

**3. Rubrics Relevance**:
```typescript
function calculateRubricsRelevance(
  source: Source,
  briefing: StrategicBriefing
): number {
  if (!briefing) return 0.5;
  
  const { priority, keyPoints } = briefing;
  
  // High priority situaties (crisis) → prefer interventie responses
  if (priority === 'high' && source.label === 'Interventie') {
    return 0.95;
  }
  
  // Check if source addresses key therapeutic points
  let relevance = 0.5;
  for (const point of keyPoints) {
    if (source.response_text.toLowerCase().includes(point.toLowerCase())) {
      relevance += 0.15;
    }
  }
  
  return Math.min(1.0, relevance);
}
```

---

### Step 4: Generate Unified Decision

```typescript
const topSource = rankedSources[0];

const decision: DecisionResult = {
  emotion: topSource.emotion,
  response: topSource.response_text,
  confidence: topSource.finalScore,
  reasoning: generateReasoning(topSource, rankedSources),
  sources: rankedSources.slice(0, 3),  // Top 3
  label: topSource.label || 'Valideren',
  symbolicInferences: extractSymbolicInferences(rankedSources)
};
```

#### Reasoning Generation

```typescript
function generateReasoning(
  chosen: ScoredSource,
  alternatives: ScoredSource[]
): string {
  const { scores } = chosen;
  
  let reasoning = `Gekozen op basis van:\n`;
  reasoning += `- Symbolische match: ${(scores.symbolicScore * 100).toFixed(0)}%\n`;
  reasoning += `- Semantische similarity: ${(scores.semanticScore * 100).toFixed(0)}%\n`;
  reasoning += `- Browser ML alignment: ${(scores.browserMLBoost * 100).toFixed(0)}%\n`;
  reasoning += `- Rubrics relevantie: ${(scores.rubricsScore * 100).toFixed(0)}%\n`;
  reasoning += `\nFinale score: ${(chosen.finalScore * 100).toFixed(0)}%\n`;
  
  if (alternatives.length > 1) {
    const secondBest = alternatives[1];
    const margin = (chosen.finalScore - secondBest.finalScore) * 100;
    reasoning += `\nMarge t.o.v. tweede keuze: ${margin.toFixed(1)}%`;
  }
  
  return reasoning;
}
```

---

### Step 5: Log Decision

```typescript
await logUnifiedDecision(
  input,
  decision,
  rankedSources,
  {
    browserML: browserMLResult,
    briefing: strategicBriefing,
    processingTime: Date.now() - startTime
  }
);
```

#### Wat wordt gelogd?

```json
{
  "user_input": "Ik voel me angstig",
  "final_response": "Het is begrijpelijk dat je je angstig voelt...",
  "confidence_score": 0.80,
  "processing_time_ms": 720,
  "symbolic_matches": [
    { "seed_id": "seed-123", "emotion": "angst", "score": 0.85 }
  ],
  "neural_similarities": [
    { "embedding_id": "emb-456", "similarity": 0.78 }
  ],
  "hybrid_decision": {
    "chosen_source": "seed-123",
    "scores": {
      "symbolic": 0.85,
      "semantic": 0.78,
      "browserML": 0.62,
      "rubrics": 0.90
    },
    "finalScore": 0.80
  },
  "api_collaboration": {
    "api1Used": false,
    "vectorApiUsed": true,
    "googleApiUsed": false,
    "seedGenerated": false
  },
  "rubrics_analysis": {
    "overallRisk": 68,
    "overallProtective": 42,
    "dominantPattern": "emotional_distress"
  },
  "created_at": "2025-10-26T14:32:10.234Z"
}
```

**Waarom zo gedetailleerd?**

Dit maakt **forensische analyse** mogelijk:
- "Waarom koos het systeem deze response 3 maanden geleden?"
- "Was er een beter alternatief beschikbaar?"
- "Hoe vaak wordt GPT fallback gebruikt?"

---

## 4. Decision Quality Metrics

### 4.1 Confidence Distribution

Uit de evaluatie (H10):

| Confidence Range | Count | Percentage | Fallback? |
|------------------|-------|------------|-----------|
| 0.90 - 1.00 | 8 | 40% | No |
| 0.75 - 0.89 | 6 | 30% | No |
| 0.60 - 0.74 | 4 | 20% | No |
| 0.40 - 0.59 | 2 | 10% | Yes (GPT) |
| < 0.40 | 0 | 0% | Yes |

**Interpretatie**: 90% van beslissingen heeft confidence > 0.60, wat betekent dat symbolische + semantische search voldoende zijn.

---

### 4.2 Source Type Distribution

| Source Type | Usage % | Avg Confidence | Avg Latency |
|-------------|---------|----------------|-------------|
| Symbolic (seed) | 55% | 0.82 | 180ms |
| Semantic (vector) | 30% | 0.74 | 320ms |
| Neural (GPT) | 15% | 0.65 | 1500ms |

**Conclusie**: Symbolische matches zijn snelst en meest confident. GPT is fallback voor edge cases.

---

## 5. Edge Cases & Error Handling

### 5.1 Empty Knowledge Base

```typescript
if (knowledgeItems.length === 0) {
  console.warn('⚠️ No knowledge found → Trigger auto-consolidation');
  
  await consolidateKnowledge();  // Migrate seeds to unified_knowledge
  
  // Retry search
  knowledgeItems = await searchUnifiedKnowledge(input, vectorApiKey);
  
  if (knowledgeItems.length === 0) {
    // Ultimate fallback
    return {
      emotion: 'neutral',
      response: 'Ik begrijp je. Kun je me meer vertellen?',
      confidence: 0.30,
      reasoning: 'Kennisbank leeg, generieke fallback',
      sources: [],
      label: 'Fout'
    };
  }
}
```

---

### 5.2 API Failures

```typescript
try {
  const embedding = await generateEmbedding(input, vectorApiKey);
} catch (error) {
  console.error('❌ Embedding API failed:', error);
  
  // Fallback to text-only search
  knowledgeItems = await textOnlySearch(input);
}
```

**Graceful degradation**: Systeem blijft werken ook als embeddings API faalt.

---

### 5.3 Conflicting Sources

Wat als twee sources even hoog scoren?

```typescript
if (Math.abs(rankedSources[0].finalScore - rankedSources[1].finalScore) < 0.05) {
  console.log('⚠️ Tie detected, using tiebreaker');
  
  // Tiebreaker 1: Recency (nieuwere seeds preferred)
  if (rankedSources[0].created_at > rankedSources[1].created_at) {
    // Keep order
  } else {
    // Swap
    [rankedSources[0], rankedSources[1]] = [rankedSources[1], rankedSources[0]];
  }
}
```

---

## 6. Performance Profiling

### Latency Breakdown (typisch geval)

```
Total: 720ms
├─ Browser ML detection: 85ms (12%)
├─ Text-based search: 120ms (17%)
├─ Embedding generation: 180ms (25%)
├─ Vector search: 150ms (21%)
├─ Ranking: 45ms (6%)
├─ Logging: 80ms (11%)
└─ Response formatting: 60ms (8%)
```

### Optimalisaties (v5.7 roadmap)

- [ ] Cache embeddings (5min TTL) → -180ms
- [ ] Parallel text + vector search → -150ms
- [ ] Async logging → -80ms
- **Expected P95**: 1390ms → **600ms** (60% reduction)

---

## Reflectie: De Complexiteit Waard?

Dit is **geen simpele** "één API call" oplossing. Het vereist:
- Meerdere database queries
- Embedding generation
- Complex ranking algoritme
- Gedetailleerde logging

**Maar**: Het levert **transparantie** op.

Ik kan exact zien:
- Waarom seed-123 werd gekozen boven seed-456
- Welke score-component de doorslag gaf
- Hoe de beslissing zou veranderen met andere gewichten

Dit is de prijs van **uitlegbare AI**. En het is de moeite waard.

---

**Vorige**: [H4 - De Ruggengraat](04_edge_database.md)  
**Volgende**: [H6 - De Zintuigen](06_browser_ml.md)
