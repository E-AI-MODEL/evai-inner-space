# EvAI Inner Space - Architectuur Documentatie

**Versie**: 5.6  
**Datum**: 26 oktober 2025

## Inhoudsopgave

1. [Overzicht](#overzicht)
2. [Neurosymbolische Pipeline](#neurosymbolische-pipeline)
3. [Data Flow](#data-flow)
4. [Component Architectuur](#component-architectuur)
5. [Database Schema](#database-schema)
6. [Edge Functions](#edge-functions)
7. [Security Layers](#security-layers)

---

## 1. Overzicht

EvAI Inner Space is een therapeutische AI-chatbot gebaseerd op een **7-laags neurosymbolisch systeem** dat symbolische kennis (emotion seeds) combineert met neural networks (OpenAI GPT, Browser ML) voor contextueel begrip en therapeutische responses.

### Kernprincipes
- **Privacy by Design**: Browser ML voor lokale emotie-detectie
- **Hybrid Reasoning**: Symbolisch (rule-based) + Neural (AI models)
- **Self-Learning**: Automatische kennisgeneratie uit conversaties
- **Rubrics-Driven**: EvAI 5.6 therapeutische rubrics voor risicoanalyse

---

## 2. Neurosymbolische Pipeline

De beslissingspipeline bestaat uit 7 sequentiële layers:

```mermaid
graph TB
    A[User Input] --> B[Layer 1: Safety Check]
    B --> C[Layer 2: Rubrics Assessment]
    C --> D[Layer 3: Strategic Briefing]
    D --> E[Layer 4: Browser ML Emotion]
    E --> F[Layer 5: Unified Knowledge Search]
    F --> G[Layer 6: Hybrid Ranking]
    G --> H[Layer 7: Self-Learning]
    H --> I[AI Response]
    
    style B fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#45b7d1
    style E fill:#96ceb4
    style F fill:#ffeaa7
    style G fill:#dfe6e9
    style H fill:#a29bfe
```

### Layer 1: Safety Check
**Doel**: Detectie van harmful content vóór verwerking

```typescript
// Input: User message
// Process: OpenAI Moderation API via evai-core edge function
// Output: { ok: boolean, decision: 'allow' | 'review' | 'block', flags: string[] }

const safety = await checkPromptSafety(userInput);
if (safety.decision === 'block') {
  return errorResponse('harmful_content');
}
```

**Technologie**: OpenAI Moderation API  
**Performance**: ~200ms latency

---

### Layer 2: EvAI 5.6 Rubrics Assessment
**Doel**: Therapeutische risicobeoordeling over 5 dimensies

```typescript
// Rubric Dimensions (EvAI 5.6):
1. Crisis Risk (0-100): Suïcidale gedachten, zelfbeschadiging
2. Emotional Distress (0-100): Intensiteit negatieve emoties
3. Social Support (0-100): Isolatie vs. steun (inverse)
4. Coping Mechanisms (0-100): Adaptieve vs. maladaptieve coping
5. Therapeutic Alliance (0-100): Vertrouwen in behandeling

// Strictness Modes:
- Flexible: Thresholds [30, 50, 70] - Breed therapeutisch bereik
- Moderate: Thresholds [40, 60, 80] - Standaard klinisch
- Strict: Thresholds [50, 70, 90] - Conservatief, hoogdrempelig
```

**Output**: `RubricsAssessment` met risk_score, protective_score, triggers[]

**Flow**:
```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant R as Rubrics Engine
    participant DB as Supabase
    
    U->>C: Chat message
    C->>R: analyzeWithRubrics(message)
    R->>R: Load rubric JSON (from DB)
    R->>R: Apply strictness mode
    R->>DB: Insert rubrics_assessment
    R->>C: { risk_score, protective_score, triggers }
    C->>C: Pass to Strategic Briefing
```

---

### Layer 3: Strategic Briefing (Regisseur)
**Doel**: Conversational-strategic analyse met rubric context

```typescript
interface StrategicBriefing {
  goal: string;              // "Empathisch reageren op angst, crisis monitoren"
  context: string;           // Samenvatting conversatie + rubric triggers
  keyPoints: string[];       // ["Hoge stress", "Sociale isolatie"]
  priority: 'low' | 'medium' | 'high';
}
```

**Integratievoorbeeld**:
```typescript
const strategicBriefing: StrategicBriefing = {
  goal: "Valideer emotie, bied veilige ruimte",
  context: `Gebruiker toont hoge emotionele distress (rubric score: 78/100).
            Triggers: eenzaamheid, stress, onzekerheid.
            Beschermende factoren: zoekt actief hulp (score: 65/100).`,
  keyPoints: [
    "Crisis risk: laag (25/100)",
    "Emotionele distress: hoog (78/100)",
    "Therapeutische alliantie: matig (60/100)"
  ],
  priority: 'high'
};
```

**Gebruikt door**: `useUnifiedDecisionCore` (Layer 5)

---

### Layer 4: Browser ML Emotion Detection
**Doel**: Client-side emotie pre-detectie zonder API calls

```typescript
// Model: Xenova/bert-base-multilingual-uncased-sentiment
// Output: { label: 'positive' | 'negative' | 'neutral', score: 0.0-1.0 }

const browserEmotion = await detectEmotion(userInput);
// Gebruikt in Layer 6 voor ranking boost
```

**Voordeel**: Privacy (lokaal) + snelheid (geen API latency)

---

### Layer 5: Unified Knowledge Search
**Doel**: Zoeken in 3 parallelle kennis-bronnen

```mermaid
graph LR
    A[User Query] --> B[Symbolic Search]
    A --> C[Semantic Search]
    A --> D[Neural Search]
    
    B --> E[emotion_seeds]
    C --> F[unified_knowledge<br/>+ vector embeddings]
    D --> G[OpenAI GPT<br/>fallback]
    
    E --> H[Knowledge Sources]
    F --> H
    G --> H
    
    H --> I[Layer 6: Ranking]
```

**1. Symbolic Search**:
```sql
-- Keyword matching in emotion_seeds
SELECT * FROM emotion_seeds
WHERE emotion ILIKE '%angst%'
  AND triggers @> ARRAY['onzekerheid']
  AND active = true
ORDER BY weight DESC, (meta->>'usageCount')::int DESC;
```

**2. Semantic Search**:
```sql
-- Vector similarity in unified_knowledge
SELECT * FROM search_unified_knowledge(
  query_text := 'ik voel me angstig',
  query_embedding := <vector>,
  similarity_threshold := 0.7
);
-- Returns top 10 semantically similar responses
```

**3. Neural Search (Fallback)**:
```typescript
// Als Symbolic + Semantic < 3 results:
const gptResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: therapeuticPrompt },
    { role: 'user', content: userInput }
  ]
});
```

---

### Layer 6: Hybrid Ranking System
**Doel**: Combineer scores uit alle bronnen voor optimale match

```typescript
interface ScoredSource {
  content: string;
  emotion: string;
  confidence: number;
  sources: {
    symbolic: number;    // 0-1 (keyword match strength)
    semantic: number;    // 0-1 (vector similarity)
    browserML: number;   // 0-1 (emotion alignment)
    rubrics: number;     // 0-1 (therapeutic relevance)
  };
  finalScore: number;    // Weighted average
}

// Ranking weights (versie 5.6):
const weights = {
  symbolic: 0.30,
  semantic: 0.35,
  browserML: 0.15,
  rubrics: 0.20
};
```

**Voorbeeld**:
```typescript
// Source A: "Het is oké om je angstig te voelen"
{
  symbolic: 0.85,   // Keyword "angstig" gevonden
  semantic: 0.78,   // Vector similarity hoog
  browserML: 0.62,  // Emotion match: negative
  rubrics: 0.90,    // Therapeutisch relevant (distress hoog)
  finalScore: 0.80  // Weighted: 0.30*0.85 + 0.35*0.78 + 0.15*0.62 + 0.20*0.90
}
```

**Output**: Top 3 hoogst scorende responses

---

### Layer 7: Self-Learning Manager
**Doel**: Automatische kennisgeneratie uit low-confidence interacties

```mermaid
flowchart TD
    A[AI Response<br/>confidence < 0.60] --> B{Trigger<br/>Self-Learning?}
    B -->|Yes| C[Generate Enhanced Seed]
    B -->|No| D[Log Only]
    
    C --> E[useEnhancedSeedGeneration]
    E --> F[OpenAI API:<br/>Seed Proposal]
    F --> G[Add to learning_queue<br/>status: pending]
    
    G --> H{Admin<br/>Curation}
    H -->|Approved| I[Inject to emotion_seeds]
    H -->|Rejected| J[Archive]
    
    I --> K[Generate Vector Embedding]
    K --> L[Add to unified_knowledge]
    
    style C fill:#a29bfe
    style I fill:#00b894
    style J fill:#ff7675
```

**Triggers**:
- Confidence < 0.60
- Nieuwe emotie gedetecteerd (niet in bestaande seeds)
- Gebruikersfeedback: dislike op response

**Process**:
```typescript
// 1. Detecteer low confidence
if (result.confidence < 0.60) {
  const outcome = await analyzeTurn(userInput, result, history);
  
  // 2. Genereer enhanced seed
  if (outcome.triggered) {
    const seed = await generateEnhancedSeed({
      emotion: detectedEmotion,
      userInput,
      conversationHistory: history
    });
    
    // 3. Voeg toe aan learning_queue
    await supabase.from('learning_queue').insert({
      seed_id: seed.id,
      confidence: result.confidence,
      curation_status: 'pending'
    });
  }
}
```

**Admin Workflow**:
```typescript
// Admin Dashboard: Learning Queue tab
const pendingSeeds = await supabase
  .from('learning_queue')
  .select('*, emotion_seeds(*)')
  .eq('curation_status', 'pending')
  .order('created_at', { ascending: false });

// Approve → Activeer seed + genereer embedding
// Reject → Archiveer met reden
```

---

## 3. Data Flow

### End-to-End Request Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Browser ML
    participant Rubrics
    participant Unified Core
    participant Edge Function
    participant OpenAI
    participant Supabase
    
    User->>React: Type message
    React->>Browser ML: detectEmotion(text)
    Browser ML-->>React: { emotion, score }
    
    React->>Rubrics: analyzeWithRubrics(text)
    Rubrics->>Supabase: Fetch rubric JSON
    Supabase-->>Rubrics: Rubric definition
    Rubrics->>Rubrics: Calculate scores
    Rubrics->>Supabase: Insert assessment
    Rubrics-->>React: RubricsAssessment
    
    React->>Unified Core: makeUnifiedDecision(input)
    Unified Core->>Unified Core: Strategic Briefing
    Unified Core->>Supabase: Search unified_knowledge
    Supabase-->>Unified Core: Knowledge sources
    
    alt Low confidence
        Unified Core->>Edge Function: OpenAI fallback
        Edge Function->>OpenAI: Chat completion
        OpenAI-->>Edge Function: Response
        Edge Function-->>Unified Core: GPT response
    end
    
    Unified Core->>Unified Core: Hybrid ranking
    Unified Core->>Supabase: Log decision
    Unified Core-->>React: UnifiedResponse
    
    React->>User: Display AI message
    
    alt Self-Learning trigger
        React->>Unified Core: analyzeTurn()
        Unified Core->>Edge Function: Generate seed
        Edge Function->>OpenAI: Seed generation
        OpenAI-->>Edge Function: Seed proposal
        Edge Function->>Supabase: Insert learning_queue
    end
```

**Latency Breakdown** (typisch):
- Browser ML: 50-150ms
- Rubrics: 100-300ms (incl. DB)
- Unified Search: 200-500ms
- OpenAI fallback: 1000-2000ms (als nodig)
- **Totaal**: 350-1000ms (zonder fallback), 1350-3000ms (met fallback)

---

## 4. Component Architectuur

### Frontend Structure

```
src/
├── components/
│   ├── ChatView.tsx              # Main chat interface
│   ├── ChatBubble.tsx            # Message display
│   ├── InputBar.tsx              # User input
│   ├── ConsentBanner.tsx         # Privacy consent
│   ├── TopBar.tsx                # Navigation
│   ├── admin/
│   │   ├── AdminDashboard.tsx    # Admin overview
│   │   ├── AdvancedSeedManager.tsx
│   │   ├── RubricSettings.tsx    # EvAI 5.6 config
│   │   └── ...
│   └── rubrics/
│       ├── RubricsToggleControl.tsx
│       └── SystemInteractionMatrix.tsx
├── hooks/
│   ├── useChat.ts                # Main chat logic
│   ├── useUnifiedDecisionCore.ts # Layer 5 logic
│   ├── useBrowserTransformerEngine.ts # Layer 4
│   ├── useEvAI56Rubrics.ts       # Layer 2
│   ├── useSelfLearningManager.ts # Layer 7
│   ├── useEnhancedSeedGeneration.ts
│   └── ...
├── lib/
│   ├── safetyGuard.ts            # Layer 1
│   ├── embeddingUtils.ts         # Vector operations
│   └── advancedSeedStorage.ts
├── pages/
│   ├── Index.tsx                 # Chat page
│   ├── AdminDashboard.tsx
│   └── AdminGuide.tsx
└── integrations/
    └── supabase/
        ├── client.ts
        └── types.ts
```

### Key Hooks

**useChat.ts**: Orchestrator
```typescript
export function useChat() {
  const { makeUnifiedDecision } = useUnifiedDecisionCore();
  const { analyzeWithRubrics } = useEvAI56Rubrics();
  const { detectEmotion } = useBrowserTransformerEngine();
  const { analyzeTurn } = useSelfLearningManager();
  
  const handleSendMessage = async (input: string) => {
    // 1. Safety check
    const safety = await checkPromptSafety(input);
    if (!safety.ok) return handleUnsafe(safety);
    
    // 2. Rubrics
    const rubrics = await analyzeWithRubrics(input);
    
    // 3. Browser ML
    const browserEmotion = await detectEmotion(input);
    
    // 4-6. Unified decision
    const result = await makeUnifiedDecision(input, {
      rubrics,
      browserEmotion,
      history: messages
    });
    
    // 7. Self-learning
    if (result.confidence < 0.60) {
      await analyzeTurn(input, result, messages);
    }
    
    return result;
  };
}
```

---

## 5. Database Schema

### Core Tables

```sql
-- Emotion Seeds (Symbolische kennis)
CREATE TABLE emotion_seeds (
  id UUID PRIMARY KEY,
  user_id UUID,
  emotion TEXT NOT NULL,
  label TEXT,
  response JSONB,              -- { nl, en, fr }
  meta JSONB,                  -- { triggers, confidence, usageCount }
  weight DOUBLE PRECISION,     -- Dynamic (feedback-driven)
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Unified Knowledge (Hybrid)
CREATE TABLE unified_knowledge (
  id UUID PRIMARY KEY,
  user_id UUID,
  content_type TEXT,           -- 'seed' | 'embedding' | 'gpt'
  emotion TEXT,
  triggers TEXT[],
  response_text TEXT,
  confidence_score DOUBLE PRECISION,
  vector_embedding vector(1536), -- pgvector
  usage_count INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Learning Queue (Self-learning)
CREATE TABLE learning_queue (
  id UUID PRIMARY KEY,
  user_id UUID,
  prompt_id UUID REFERENCES chat_messages(id),
  seed_id UUID REFERENCES emotion_seeds(id),
  feedback_text TEXT,
  confidence DOUBLE PRECISION,
  curation_status TEXT CHECK (curation_status IN ('pending', 'approved', 'rejected')),
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Rubrics Assessments
CREATE TABLE rubrics_assessments (
  id UUID PRIMARY KEY,
  user_id UUID,
  conversation_id TEXT,
  message_content TEXT,
  rubric_id TEXT,              -- 'evai56'
  risk_score DOUBLE PRECISION,
  protective_score DOUBLE PRECISION,
  overall_score DOUBLE PRECISION,
  triggers JSONB,              -- [{ dimension, score, threshold_exceeded }]
  confidence_level TEXT,       -- 'low' | 'medium' | 'high'
  processing_mode TEXT,        -- 'flexible' | 'moderate' | 'strict'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Decision Logs (Observability)
CREATE TABLE decision_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  conversation_id TEXT,
  user_input TEXT,
  final_response TEXT,
  confidence_score DOUBLE PRECISION,
  processing_time_ms INT,
  symbolic_matches JSONB,
  neural_similarities JSONB,
  hybrid_decision JSONB,
  api_collaboration JSONB,     -- { api1Used, api2Used, ... }
  rubrics_analysis JSONB,
  workflow_version TEXT,       -- '5.6'
  created_at TIMESTAMP
);
```

### Indexes & Performance

```sql
-- Vector similarity search (HNSW)
CREATE INDEX idx_unified_knowledge_embedding
ON unified_knowledge
USING hnsw (vector_embedding vector_cosine_ops);

-- Full-text search
CREATE INDEX idx_unified_knowledge_search
ON unified_knowledge
USING gin(search_vector);

-- Learning queue filtering
CREATE INDEX idx_learning_queue_status
ON learning_queue(curation_status);

-- Rubrics time-series queries
CREATE INDEX idx_rubrics_created
ON rubrics_assessments(created_at DESC);
```

---

## 6. Edge Functions

### evai-core (Primary)

**File**: `supabase/functions/evai-core/index.ts`

**Operations**:
1. **chat**: OpenAI chat completions (fallback Layer 5)
2. **embedding**: Text embeddings (Layer 5 semantic search)
3. **safety**: Content moderation (Layer 1)

```typescript
// Example: Safety check
POST /functions/v1/evai-core
{
  "operation": "safety",
  "text": "User input here"
}

// Response:
{
  "ok": true,
  "decision": "allow",
  "score": 0.95,
  "flags": []
}
```

**Rate Limiting**: 60 req/min per user (future enhancement)

---

### evai-admin (Admin)

**File**: `supabase/functions/evai-admin/index.ts`

**Operations**:
- Seed curation (approve/reject learning_queue)
- Bulk operations (activate/deactivate seeds)
- System health checks

---

## 7. Security Layers

### 7.1 Row-Level Security (RLS)

Alle tabellen hebben RLS enabled:

```sql
-- Example: emotion_seeds
CREATE POLICY "Single user access"
ON emotion_seeds
FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Future: Multi-user support
CREATE POLICY "Users access own data"
ON emotion_seeds
FOR ALL
USING (user_id = auth.uid());
```

### 7.2 API Key Management

```typescript
// NEVER in client code:
// const apiKey = "sk-...";

// ✅ Always via Edge Functions:
const { data } = await supabase.functions.invoke('evai-core', {
  body: { operation: 'chat', prompt: '...' }
});
```

**Environment Variables** (Supabase Secrets):
- `OPENAI_API_KEY`: Primary GPT access
- `OPENAI_API_KEY_SECONDARY`: Secondary analysis
- `VECTOR_API_KEY`: Embeddings
- `OPENAI_API_KEY_SAFETY`: Moderation

### 7.3 Input Validation

```typescript
// In Edge Functions:
if (!text || text.length > 5000) {
  throw new Error('Invalid input length');
}

// Sanitization:
const sanitized = text.trim().replace(/[<>]/g, '');
```

---

## 8. Performance Optimizations

### 8.1 Client-Side Caching
```typescript
// React Query (5min cache):
const { data: seeds } = useQuery({
  queryKey: ['emotion-seeds'],
  queryFn: fetchSeeds,
  staleTime: 5 * 60 * 1000
});
```

### 8.2 Database Optimizations
- **Materialized views**: Voor analytics queries
- **Partial indexes**: Op active=true kolommen
- **Connection pooling**: Supabase Pooler (6053 port)

### 8.3 Edge Function Best Practices
- **Warm starts**: Keep functions warm met periodic pings
- **Parallel requests**: Batch multiple operations
- **Streaming**: Voor lange OpenAI responses (future)

---

## 9. Observability

### Monitoring Stack
- **Supabase Dashboard**: Real-time logs, metrics
- **decision_logs**: Alle AI beslissingen gelogd
- **api_collaboration_logs**: API usage tracking
- **reflection_logs**: Self-learning events

### Key Metrics
```sql
-- Average confidence per day
SELECT
  DATE(created_at) as date,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) as decisions
FROM decision_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Rubrics risk trends
SELECT
  DATE(created_at) as date,
  AVG(risk_score) as avg_risk,
  AVG(protective_score) as avg_protective
FROM rubrics_assessments
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);
```

---

## 10. Deployment

### Stack
- **Frontend**: Lovable.dev (React + Vite)
- **Database**: Supabase PostgreSQL 15 + pgvector
- **Edge Functions**: Deno runtime (Supabase)
- **Models**: OpenAI GPT-4o-mini, Transformers.js (browser)

### CI/CD
- Auto-deploy on push to main
- Edge functions deployed via Supabase CLI
- Database migrations tracked in `supabase/migrations/`

---

**Next Steps**: Zie [roadmap.md](./roadmap.md) voor geplande features.

**Questions?** Open een issue of contact: privacy@evai-innerspace.nl
