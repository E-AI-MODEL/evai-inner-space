# v20 Architectuur - Volledige Integratie

## Overzicht

v20 integreert de ethische laag (EAA/TD-Matrix/E_AI Rules) in **ALLE** verwerkingspaden, zodat geen enkele AI-output ongevalideerd naar de gebruiker gaat.

## Architectuur Flow

```
User Input
    ↓
Safety Check (harmful content detection)
    ↓
v20 Pre-Filter: EAA Evaluation ← 🆕 LAYER 0
    ↓
Rubrics Assessment (EvAI 5.6)
    ↓
Enhanced EAA (with rubric context) ← 🆕 ENRICHED
    ↓
Strategic Briefing (conditional, alleen bij complexe input)
    ↓
┌─────────────────────────────────────────┐
│ Knowledge Search (Browser ML + Vector)  │
│                                         │
│ IF Confidence > 0.70:                   │
│   → Seed-Based Response                 │
│   → hybrid.ts Orchestrator              │
│      - Policy Engine                    │
│      - Semantic Graph                   │
│      - Validation Layer                 │
│      - v20 TD-Matrix Check ← 🆕         │
│      - v20 E_AI Rules Check ← 🆕        │
│      - v20 EAA Strategy Validation ← 🆕 │
│                                         │
│ ELSE:                                   │
│   → Learning Mode                       │
│   → Generate New Seed (LLM)             │
│   → v20 TD-Matrix Check ← 🆕            │
│   → v20 E_AI Rules Check ← 🆕           │
│   → Store Seed (if validated)           │
└─────────────────────────────────────────┘
    ↓
Final Response (fully validated)
```

## Nieuwe v20 Checkpoints

### 1. Pre-Filter EAA (LAYER 0)
**Locatie**: `useProcessingOrchestrator.ts` regel 157
**Functie**: Evalueer EAA VÓÓr knowledge search
**Output**: 
- `eaaProfile`: Basis EAA scores
- `enhancedEAA`: EAA verrijkt met rubric context

```typescript
const eaaProfile = evaluateEAA(userInput);
const enhancedEAA = evaluateEAA(userInput, {
  riskScore: rubricResult.overallRisk / 100,
  protectiveScore: rubricResult.overallProtective / 100,
  dominantPattern: rubricResult.dominantPattern
});
```

### 2. TD-Matrix Check (High Confidence Path)
**Locatie**: `hybrid.ts` regel 234-250
**Functie**: Check AI dominance vs user agency
**Triggers**:
- TD > 0.8 → BLOCK output
- TD > 0.7 + agency < 0.3 → BLOCK

```typescript
const aiContribution = estimateAIContribution(answer);
const tdScore = evaluateTD(aiContribution, eaaProfile.agency);
if (tdScore.shouldBlock) {
  // Fallback to safety response
}
```

### 3. E_AI Rules Engine (High Confidence Path)
**Locatie**: `hybrid.ts` regel 252-276
**Functie**: Symbolische ethische regels
**Rules**:
- rule_001: Agency loss bij lage A + hoge TD
- rule_002: Bias detectie
- rule_003: Metacognitieve reflectie
- rule_004: Agency verhogen
- rule_005: Compliance check
- rule_006: Block bij structureel agency loss

### 4. Learning Mode Validation (Low Confidence Path)
**Locatie**: `useProcessingOrchestrator.ts` regel 395-428
**Functie**: Valideer LLM-generated seeds
**Checks**:
- TD-Matrix voor generated content
- E_AI Rules voor ethical compliance
- Block seed als validatie faalt

```typescript
const seedAIContribution = estimateAIContribution(newSeed.response.nl);
const seedTD = evaluateTD(seedAIContribution, enhancedEAA.agency);

if (seedTD.shouldBlock) {
  throw new Error('Learning mode blocked by TD-Matrix');
}

const eaiResult = evaluateEAIRules(eaiContext);
if (eaiResult.triggered && shouldBlock) {
  throw new Error('Learning mode blocked by E_AI rule');
}
```

### 5. LLM_PLANNING Implementation
**Locatie**: `hybrid.ts` regel 193-224
**Functie**: Echte LLM generation met EAA constraints
**Edge Function**: `supabase/functions/evai-core/llm-generator.ts`

```typescript
case 'LLM_PLANNING':
  const { data: llmData } = await supabase.functions.invoke('evai-core', {
    body: {
      operation: 'generate-response',
      input: ctx.userInput,
      emotion,
      allowedInterventions,
      eaaProfile,
      conversationHistory: ctx.conversationHistory?.slice(-6) || []
    }
  });
```

## LLM Generator met EAA Constraints

**Locatie**: `supabase/functions/evai-core/llm-generator.ts`

### System Prompt Bouw

De LLM krijgt een dynamische system prompt gebaseerd op EAA-profiel:

**Bij lage agency (< 0.4)**:
```
⚠️ LAGE AGENCY: Gebruiker voelt machteloosheid
- ALLEEN reflectieve vragen stellen
- GEEN suggesties of concrete acties
- Focus op begrijpen en erkennen
```

**Bij lage autonomie (< 0.3)**:
```
⚠️ LAGE AUTONOMIE: Gebruiker voelt druk
- GEEN sturende taal gebruiken
- Vermijd "moet", "zou moeten"
```

**Bij lage ownership (< 0.4)**:
```
⚠️ LAGE OWNERSHIP: Weinig persoonlijke betrokkenheid
- Focus op validatie en erkenning
- Geen diepgaande persoonlijke vragen
```

## Validatie Matrix

| Scenario | v20 Checks | Fallback |
|----------|------------|----------|
| **High Confidence Seed** | TD-Matrix + E_AI + EAA Strategy | Safety fallback |
| **Low Confidence** | Learning Mode → TD + E_AI validation | Block + error |
| **LLM_PLANNING** | EAA constraints in prompt + post-TD check | Template fallback |
| **Learning Mode** | TD-Matrix + E_AI pre-save | Skip seed generation |

## Error Handling

Alle v20 checks hebben try-catch blokken met fallbacks:
- EAA evaluation faalt → gebruik defaults (0.5, 0.5, 0.5)
- TD-Matrix faalt → skip check, log warning
- E_AI Rules faalt → skip check, log warning
- Learning Mode validation faalt → throw error (block seed)

## Audit Trail

Alle v20 beslissingen worden gelogd in:
- `auditLog` array in orchestrator
- Supabase `decision_logs` table
- Console logs met 🧠 prefix

## Performance Impact

- **Pre-Filter EAA**: +5ms (synchronous text analysis)
- **TD-Matrix Check**: +3ms (synchronous calculation)
- **E_AI Rules**: +2ms (synchronous rule evaluation)
- **LLM Generation**: +500-1500ms (OpenAI API call)

**Totaal**: Minimale overhead (<10ms) voor symbolische checks, significante tijd alleen bij LLM generation.

## Testing

Alle v20 modules zijn unit testbaar:
- `eaaEvaluator.ts`: Text → EAA scores
- `tdMatrix.ts`: AI contribution + agency → TD score
- `eai.rules.ts`: EAI context → triggered rules
- `llm-generator.ts`: Request → LLM response met constraints

## Migration Notes

**Breaking Changes**: GEEN
**Backward Compatible**: JA
**Feature Flags**: GEEN (altijd actief)

v20 is volledig backwards compatible. Alle bestaande flows blijven werken, maar krijgen nu extra ethische validatie.
