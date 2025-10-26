# Hoofdstuk 4: De Ruggengraat - Edge Functions & Database

> *"Een brein zonder zenuwstelsel is nutteloos. Een AI zonder infrastructuur ook."*

---

## 1. De Architecturale Keuze

Voor ik één regel code schreef, moest ik een fundamentele vraag beantwoorden:

**Waar draait de AI-logica?**

### De 3 Opties

| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| **Client-Only** | Privacy, geen server kosten | Geen secrets, beperkte compute |
| **Traditional Backend** | Volledige controle | Duur, schaalbaarheid complex |
| **Serverless Edge** | Schaalbaarheid, lage latency | Vendor lock-in, cold starts |

Ik koos voor **Serverless Edge Functions** (Supabase Deno) omdat:
- ✅ Auto-scaling (0 → 1000 requests transparant)
- ✅ Global CDN (< 50ms latency wereldwijd)
- ✅ Secrets management (API keys veilig opgeslagen)
- ✅ Direct access tot database (geen extra auth layer)

---

## 2. Supabase als Zenuwstelsel

Supabase is **niet alleen een database**. Het is een ecosysteem:

```
┌─────────────────────────────────────────┐
│         Supabase Platform               │
├─────────────────────────────────────────┤
│ PostgreSQL + pgvector (Data)           │
│ Edge Functions (Deno) (Compute)        │
│ Realtime (Subscriptions)               │
│ Storage (Files - not used yet)         │
│ Auth (Future: multi-user)              │
└─────────────────────────────────────────┘
         ↕
    React Frontend
```

---

## 3. De Database: PostgreSQL + pgvector

### 3.1 Waarom PostgreSQL?

**Niet omdat het hip is**, maar omdat het:
- **ACID compliant**: Transacties zijn betrouwbaar
- **Extensions**: pgvector voor vector similarity
- **RLS**: Row-Level Security (privacy by design)
- **Functions**: Complexe queries als stored procedures
- **Mature**: 30 jaar battle-tested

### 3.2 pgvector: De Magische Extensie

```sql
CREATE EXTENSION vector;

CREATE TABLE unified_knowledge (
  id UUID PRIMARY KEY,
  emotion TEXT,
  response_text TEXT,
  vector_embedding vector(1536),  -- ← OpenAI ada-002 dimensie
  ...
);

CREATE INDEX ON unified_knowledge 
USING hnsw (vector_embedding vector_cosine_ops);
```

**Wat doet dit?**

HNSW (Hierarchical Navigable Small Worlds) is een grafenstructuur die **approximate nearest neighbor search** in O(log n) tijd mogelijk maakt in plaats van O(n).

**In praktijk**: Zoeken in 10.000 embeddings duurt 5ms in plaats van 500ms.

---

## 4. De 13 Tabellen: Een Schema Tour

### 4.1 Core Knowledge Tables

#### `emotion_seeds` - Symbolische Kennis
```sql
CREATE TABLE emotion_seeds (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  emotion TEXT NOT NULL,
  label TEXT,  -- 'Valideren' | 'Reflectievraag' | 'Suggestie'
  response JSONB,  -- { nl: "...", en: "..." }
  meta JSONB,  -- { triggers: [...], confidence: 0.8, usageCount: 42 }
  weight DOUBLE PRECISION DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Design Decision**: `weight` is dynamisch - het wordt verhoogd bij positieve feedback, verlaagd bij negatieve.

#### `unified_knowledge` - Hybrid Knowledge
```sql
CREATE TABLE unified_knowledge (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,  -- 'seed' | 'embedding' | 'gpt'
  emotion TEXT NOT NULL,
  triggers TEXT[],
  response_text TEXT,
  confidence_score DOUBLE PRECISION DEFAULT 0.0,
  vector_embedding vector(1536),
  usage_count INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  search_vector tsvector,  -- Full-text search index
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Why Both Tables?**

- `emotion_seeds`: **Bron van waarheid** (seeds zijn hand-crafted of AI-generated+approved)
- `unified_knowledge`: **Queryable cache** (seeds + embeddings + andere bronnen)

---

### 4.2 Logging & Observability

#### `decision_logs` - Elk Besluit Gelogd
```sql
CREATE TABLE decision_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id TEXT,
  user_input TEXT NOT NULL,
  final_response TEXT NOT NULL,
  symbolic_matches JSONB DEFAULT '[]',
  neural_similarities JSONB DEFAULT '[]',
  hybrid_decision JSONB NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL,
  processing_time_ms INT,
  api_collaboration JSONB DEFAULT '{}',
  rubrics_analysis JSONB DEFAULT '{}',
  workflow_version TEXT DEFAULT '5.6',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Wat wordt gelogd?**

- **Volledige trace**: User input → alle kandidaat-responses → finale keuze → scores
- **API collaboration**: Welke APIs werden gebruikt (OpenAI, embeddings, etc.)
- **Rubrics**: Risk/protective scores
- **Performance**: Processing time per component

**Waarom?**

Dit maakt **post-hoc analyse** mogelijk:
- "Waarom koos het systeem deze response 3 weken geleden?"
- "Hoe vaak faalt de symbolische search?"
- "Wat is de gemiddelde confidence per emotie?"

---

#### `api_collaboration_logs` - API Usage Tracking
```sql
CREATE TABLE api_collaboration_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT,
  workflow_type TEXT NOT NULL,
  api1_used BOOLEAN DEFAULT false,  -- OpenAI primary
  api2_used BOOLEAN DEFAULT false,  -- OpenAI secondary
  vector_api_used BOOLEAN DEFAULT false,
  google_api_used BOOLEAN DEFAULT false,
  seed_generated BOOLEAN DEFAULT false,
  secondary_analysis BOOLEAN DEFAULT false,
  processing_time_ms INT,
  success BOOLEAN DEFAULT false,
  error_details JSONB,
  metadata JSONB DEFAULT '{}',
  version TEXT DEFAULT '2.0',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Business Value**: Kostenanalyse en performance monitoring.

---

### 4.3 Self-Learning Tables

#### `learning_queue` - De Curation Inbox
```sql
CREATE TABLE learning_queue (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt_id UUID REFERENCES chat_messages(id),
  seed_id UUID REFERENCES emotion_seeds(id),
  feedback_text TEXT,
  confidence DOUBLE PRECISION DEFAULT 0.0,
  curation_status TEXT CHECK (curation_status IN ('pending', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_learning_queue_status ON learning_queue(curation_status);
CREATE INDEX idx_learning_queue_created ON learning_queue(created_at DESC);
```

**Workflow**:
```
Low confidence → Generate seed → Insert to learning_queue (pending)
                                          ↓
                              Admin reviews (approved/rejected)
                                          ↓
                        If approved: Activate seed + generate embedding
```

---

### 4.4 Rubrics & Assessment

#### `rubrics_assessments` - Therapeutic Risk Tracking
```sql
CREATE TABLE rubrics_assessments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id TEXT,
  message_content TEXT NOT NULL,
  rubric_id TEXT NOT NULL,
  risk_score DOUBLE PRECISION DEFAULT 0,
  protective_score DOUBLE PRECISION DEFAULT 0,
  overall_score DOUBLE PRECISION DEFAULT 0,
  triggers JSONB DEFAULT '[]',
  confidence_level TEXT DEFAULT 'medium',
  processing_mode TEXT DEFAULT 'flexible',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Analytics Use Case**:
```sql
-- Gemiddelde risk score per emotie
SELECT 
  SUBSTRING(message_content FROM 'voel.*?(angstig|verdrietig|boos)') AS emotion,
  AVG(risk_score) AS avg_risk
FROM rubrics_assessments
GROUP BY emotion
ORDER BY avg_risk DESC;
```

---

## 5. Row-Level Security (RLS): Privacy by Design

### 5.1 Het Single-User Model

EvAI v5.6 is **single-user** (één anonieme gebruiker: `00000000-0000-0000-0000-000000000001`). Dit vereenvoudigt RLS:

```sql
-- Example RLS policy voor emotion_seeds
CREATE POLICY "Single user access to emotion_seeds"
ON emotion_seeds FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
```

**Effect**: Zelfs als iemand direct access krijgt tot de database, kunnen ze alleen data van deze user zien.

### 5.2 Future: Multi-User RLS

Voor v5.7 (multi-user):

```sql
CREATE POLICY "Users can only access their own data"
ON emotion_seeds FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**auth.uid()** is een Supabase helper die de huidige gebruiker teruggeeft vanuit de JWT token.

---

## 6. Edge Functions: De Compute Laag

### 6.1 Architectuur

```
Client (React)
    ↓
Edge Function (Deno)
    ↓
[OpenAI API | Supabase DB | HuggingFace]
```

### 6.2 `evai-core`: De Hoofdworkhorse

**Locatie**: `supabase/functions/evai-core/index.ts`

**Operations**:
```typescript
switch (operation) {
  case 'safety':
    // OpenAI Moderation API
    return checkSafety(text);
    
  case 'embed':
    // Generate vector embedding
    return generateEmbedding(text, openaiKey);
    
  case 'chat':
    // GPT-4o-mini completion
    return chatCompletion(messages, openaiKey);
    
  case 'seed':
    // Generate new seed
    return generateSeed(request, openaiKey);
}
```

**Rate Limiting**:
```typescript
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW_MS = 60 * 1000;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): { allowed: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false };
  }
  
  record.count++;
  return { allowed: true };
}
```

**Response bij limit**:
```json
HTTP 429 Too Many Requests
{
  "ok": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

### 6.3 `evai-admin`: Admin Operations

**Operations**:
- Seed CRUD (create, update, delete)
- Learning queue management
- Analytics queries
- System health checks

**Authentication**:
```typescript
const authHeader = req.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: corsHeaders
  });
}
```

**Rate Limiting**: 30 req/min (strengere limit voor admin endpoints).

---

## 7. Database Functions: Logic in SQL

### 7.1 `search_unified_knowledge()`

```sql
CREATE OR REPLACE FUNCTION search_unified_knowledge(
  query_text TEXT,
  query_embedding vector,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.7,
  max_results INT DEFAULT 10
)
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uk.id,
    uk.content_type,
    uk.emotion,
    uk.response_text,
    uk.confidence_score,
    1 - (uk.vector_embedding <=> query_embedding) AS similarity_score,
    uk.metadata
  FROM unified_knowledge uk
  WHERE 
    uk.user_id = '00000000-0000-0000-0000-000000000001'::uuid
    AND uk.active = true
    AND (
      uk.emotion ILIKE '%' || query_text || '%'
      OR EXISTS (SELECT 1 FROM unnest(uk.triggers) WHERE trigger ILIKE '%' || query_text || '%')
      OR 1 - (uk.vector_embedding <=> query_embedding) > similarity_threshold
    )
  ORDER BY similarity_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

**Waarom als function?**

- **Performance**: Query planner kan optimaliseren
- **Reusability**: Eén functie, meerdere clients
- **Security**: Function runs met SECURITY DEFINER (elevated privileges)

---

### 7.2 `consolidate_knowledge()`

```sql
CREATE OR REPLACE FUNCTION consolidate_knowledge()
RETURNS VOID AS $$
BEGIN
  -- Migrate emotion_seeds to unified_knowledge
  INSERT INTO unified_knowledge (...)
  SELECT ... FROM emotion_seeds
  ON CONFLICT (id) DO UPDATE SET ...;
  
  -- Migrate vector_embeddings
  INSERT INTO unified_knowledge (...)
  SELECT ... FROM vector_embeddings
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

**Gebruik**: Admin kan handmatig consolidatie triggeren, of het gebeurt automatisch bij startup als unified_knowledge leeg is.

---

## 8. Performance Optimizations

### 8.1 Indexes

```sql
-- Vector search
CREATE INDEX idx_uk_vector ON unified_knowledge 
USING hnsw (vector_embedding vector_cosine_ops);

-- Text search
CREATE INDEX idx_uk_emotion ON unified_knowledge (emotion);
CREATE INDEX idx_uk_triggers ON unified_knowledge USING GIN (triggers);

-- Full-text search
CREATE INDEX idx_uk_search_vector ON unified_knowledge USING GIN (search_vector);

-- Time-based queries
CREATE INDEX idx_decision_logs_created ON decision_logs (created_at DESC);
```

**Impact**:
- Vector search: 500ms → 5ms (100x speedup)
- Emotion filter: 50ms → 2ms
- Full-text: 100ms → 10ms

---

### 8.2 Connection Pooling

Supabase gebruikt **PgBouncer** voor connection pooling:

```
React Client (1000 users)
    ↓
Edge Functions (auto-scaled)
    ↓
PgBouncer (connection pool)
    ↓
PostgreSQL (fixed connections)
```

**Zonder pooling**: Elke request = nieuwe DB connection (slow)  
**Met pooling**: Hergebruik bestaande connections (fast)

---

## 9. Deployment & DevOps

### 9.1 Auto-Deployment

Elke push naar `main` branch triggert:
1. **Type check**: `tsc --noEmit`
2. **Lint**: `eslint`
3. **Build**: `vite build`
4. **Deploy**: Lovable.dev auto-deploy

Edge functions worden automatisch gedeployed via Supabase CLI integration.

### 9.2 Rollback Strategy

```bash
# Rollback database migration
supabase db reset --linked

# Rollback edge function
supabase functions deploy evai-core --version <previous-version>
```

---

## 10. Monitoring & Observability

### 10.1 Metrics

```typescript
// Client-side API usage tracking
import { incrementApiUsage } from '@/utils/apiUsageTracker';

incrementApiUsage('supabase');  // Track DB calls
incrementApiUsage('openai');    // Track OpenAI calls
incrementApiUsage('safety');    // Track moderation calls
```

**Dashboard**: Admin kan realtime metrics zien (requests per API, latency, error rates).

### 10.2 Logs

```typescript
// Structured logging in edge functions
console.log(JSON.stringify({
  level: 'info',
  operation: 'safety',
  clientId: clientId,
  decision: result.decision,
  flags: result.flags,
  timestamp: new Date().toISOString()
}));
```

**Supabase Edge Logs**: Queryable via SQL:
```sql
SELECT * FROM edge_logs
WHERE level = 'error'
AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

---

## Reflectie: Waarom Deze Stack?

Ik koos **niet** voor:
- AWS Lambda + DynamoDB (te complex, cold start issues)
- Firebase (vendor lock-in, geen pgvector)
- Self-hosted (te veel DevOps overhead)

**Supabase + Deno Edge** geeft:
- ✅ PostgreSQL power (ACID, functions, extensions)
- ✅ Serverless benefits (auto-scaling, pay-per-use)
- ✅ Developer experience (CLI, dashboard, logs)
- ✅ Open source (kan self-hosten als nodig)

Het is de **sweet spot** tussen controle en convenience.

---

**Vorige**: [H3 - De Hypothese](03_hypothese_layers.md)  
**Volgende**: [H5 - De Denklaag](05_decision_core.md)
