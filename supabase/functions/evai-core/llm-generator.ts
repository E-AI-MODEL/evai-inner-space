// LLM Response Generator with v20 EAA constraints + NGBSE Bias Check
// This module generates contextual responses using OpenAI with ethical constraints

interface LLMGenerationRequest {
  input: string;
  emotion: string;
  allowedInterventions: string[];
  eaaProfile: {
    ownership: number;
    autonomy: number;
    agency: number;
  };
  conversationHistory: Array<{ role: string; content: string }>;
}

interface LLMGenerationResponse {
  response: string;
  model: string;
  reasoning: string;
}

export async function generateLLMResponse(
  req: LLMGenerationRequest,
  openaiApiKey: string
): Promise<LLMGenerationResponse> {
  const { input, emotion, allowedInterventions, eaaProfile, conversationHistory } = req;
  
  // Build system prompt with EAA constraints
  const systemPrompt = buildSystemPrompt(emotion, allowedInterventions, eaaProfile);
  
  // Build conversation context
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map(h => ({
      role: h.role,
      content: h.content
    })),
    { role: 'user', content: input }
  ];
  
  console.log('🤖 LLM Generation:', {
    emotion,
    agency: eaaProfile.agency.toFixed(2),
    interventions: allowedInterventions.length,
    historyLength: conversationHistory.length
  });
  
  // Call OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 200
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const generatedText = data.choices[0]?.message?.content || '';
  
  if (!generatedText) {
    throw new Error('Empty response from OpenAI');
  }
  
  return {
    response: generatedText,
    model: 'gpt-4o-mini',
    reasoning: `Generated with agency=${eaaProfile.agency.toFixed(2)}, interventions=${allowedInterventions.join(',')}`
  };
}

export function buildSystemPrompt(
  emotion: string,
  allowedInterventions: string[],
  eaaProfile: { ownership: number; autonomy: number; agency: number },
  seedGuidance?: string
): string {
  const { ownership, autonomy, agency } = eaaProfile;
  
  let prompt = `Je bent een empathische AI-coach die helpt bij emotionele ondersteuning.

EMOTIONELE CONTEXT: ${emotion}

GEBRUIKER EAA-PROFIEL:
- Eigenaarschap (ownership): ${(ownership * 100).toFixed(0)}% - ${ownership > 0.6 ? 'Hoog: gebruiker voelt sterke verbinding' : ownership > 0.4 ? 'Gemiddeld: enige verbinding' : 'Laag: weinig persoonlijke betrokkenheid'}
- Autonomie: ${(autonomy * 100).toFixed(0)}% - ${autonomy > 0.5 ? 'Hoog: voelt keuzevrijheid' : autonomy > 0.3 ? 'Gemiddeld: enige autonomie' : 'Laag: weinig keuzevrijheid ervaren'}
- Agency: ${(agency * 100).toFixed(0)}% - ${agency > 0.6 ? 'Hoog: voelt handelingsbekwaamheid' : agency > 0.4 ? 'Gemiddeld: kan iets doen' : 'Laag: voelt machteloos'}

TOEGESTANE INTERVENTIES: ${allowedInterventions.join(', ')}
`;

  if (seedGuidance) {
    prompt += `
THERAPEUTISCHE ANKER (SEED):
${seedGuidance}

JOUW TAAK:
- Gebruik de seed als therapeutische basis (WAT gezegd MOET worden)
- Vertaal naar deze specifieke conversatie
- Voeg persoonlijke aansluiting toe
- Behoud therapeutische intentie
`;
  }

  prompt += `
GEDRAGSRICHTLIJNEN:`;

  // Low agency constraints
  if (agency < 0.4) {
    prompt += `
- ⚠️ LAGE AGENCY: Gebruiker voelt machteloosheid
- ALLEEN reflectieve vragen stellen
- GEEN suggesties of concrete acties voorstellen
- Focus op begrijpen en erkennen
- Voorbeeld: "Wat maakt het nu zo moeilijk?"`;
  } else if (agency < 0.6) {
    prompt += `
- GEMIDDELDE AGENCY: Voorzichtige begeleiding
- Kleine, haalbare stappen voorstellen
- Vragen stellen die perspectief bieden
- Voorbeeld: "Zou het helpen om..."`;
  } else {
    prompt += `
- HOGE AGENCY: Gebruiker kan actie ondernemen
- Concrete suggesties toegestaan
- Voorbeeld: "Je zou kunnen proberen om..."`;
  }
  
  // Low autonomy constraints
  if (autonomy < 0.3) {
    prompt += `
- ⚠️ LAGE AUTONOMIE: Gebruiker voelt druk
- GEEN sturende taal gebruiken
- Keuzes open houden
- Vermijd "moet", "zou moeten"`;
  }
  
  // Low ownership constraints
  if (ownership < 0.4) {
    prompt += `
- ⚠️ LAGE OWNERSHIP: Weinig persoonlijke betrokkenheid
- Focus op validatie en erkenning
- Geen diepgaande persoonlijke vragen`;
  }
  
  prompt += `

ANTWOORDSTIJL:
- Maximum 2-3 zinnen
- Empathisch en warm
- Nederlands
- Direct en concreet
`;
  
  return prompt;
}

// NGBSE Bias Checker
export async function handleBiasCheck(body: any, openAIKey: string, corsHeaders: any) {
  if (!openAIKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "OPENAI_API_KEY not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { text, context } = body || {};

  if (!text || typeof text !== 'string') {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid text for bias check" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log('🔍 Bias check:', { textLength: text.length });

  const systemPrompt = `Je bent een expert in het detecteren van bias in AI-gegenereerde teksten.
Analyseer de gegeven AI-response op de volgende types bias:
- Gender bias (stereotypering van mannen/vrouwen)
- Culturele bias (aannames over cultuur/normen)
- Leeftijds bias (aannames over leeftijd)
- Socio-economische bias (aannames over status)

Retourneer ALLEEN een JSON object met dit exacte formaat:
{
  "detected": boolean,
  "types": ["gender", "cultural", etc.],
  "severity": "low" | "medium" | "high" | "critical",
  "description": "korte beschrijving van gedetecteerde bias",
  "confidence": number (0.0-1.0)
}`;

  const userPrompt = `AI Response: "${text}"

${context ? `User Context: "${context}"` : ''}

Analyseer deze response op bias. Wees kritisch maar realistisch.`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('🔴 Bias check API error:', resp.status, errorText);
      return new Response(
        JSON.stringify({
          detected: false,
          types: [],
          severity: 'low',
          description: 'Bias check kon niet worden uitgevoerd',
          confidence: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    let biasResult;
    try {
      biasResult = JSON.parse(content);
    } catch {
      biasResult = {
        detected: false,
        types: [],
        severity: 'low',
        description: 'Parse error',
        confidence: 0
      };
    }

    return new Response(
      JSON.stringify(biasResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('🔴 Bias check error:', error);
    return new Response(
      JSON.stringify({
        detected: false,
        types: [],
        severity: 'low',
        description: 'Error tijdens bias check',
        confidence: 0
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
