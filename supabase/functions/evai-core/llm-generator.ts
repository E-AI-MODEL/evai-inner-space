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
  seedGuidance?: string,
  userInput?: string,
  conversationHistory?: Array<{ role: string; content: string }>
): string {
  const { ownership, autonomy, agency } = eaaProfile;
  
  let prompt = `Je bent een empathische gesprekspartner die luistert en ondersteunt. Je reageert natuurlijk en persoonlijk, alsof je met een vriend praat.

De persoon ervaart nu: ${emotion}

Jouw rol:
${agency > 0.6 ? '- Help hen hun eigen kracht te zien en stappen te zetten' : agency > 0.4 ? '- Bied keuzes en laat hen bepalen wat helpt' : '- Wees er vooral, luister, valideer hun gevoel'}
${autonomy > 0.5 ? '- Laat hen de regie voelen en kiezen' : '- Bied zachte suggesties, geen directieve adviezen'}
${ownership > 0.6 ? '- Sluit aan bij hun verbondenheid met de situatie' : '- Help hen perspectief te krijgen'}

Focus op: ${allowedInterventions.join(', ')}
`;

  // ✅ LAYER 3 FIX: Context validation BEFORE fusion
  if (seedGuidance) {
    const isGreeting = /^(hi|hallo|hey|hoi)/i.test(userInput || '');
    const isFirstMessage = (conversationHistory?.length || 0) === 0;
    const seedIsReflective = /wat zou er gebeuren|hoe zou het zijn|denk eens na|zou je|als je/i.test(seedGuidance);
    
    if (isGreeting && isFirstMessage && seedIsReflective) {
      console.warn('⚠️ LAYER 3: Context mismatch detected - reflective seed for greeting → SKIP fusion');
      // SKIP fusion instruction, let LLM generate natural greeting instead
    } else {
      prompt += `

Een ervaren therapeut suggereert deze richting:
"${seedGuidance}"

Gebruik dit als INSPIRATIE, niet als script:
- Voel de therapeutische intentie (het 'waarom')
- Vorm het om naar natuurlijke, persoonlijke taal
- Pas het aan het moment in dit gesprek
- Maak het kort en toegankelijk

Het gaat om de kern, niet de exacte woorden.
`;
    }
  }

  prompt += `

Praktische tips:
- Reageer zoals je zou sms'en naar een goede vriend
- Houd het kort (meestal 1-3 zinnen is genoeg)
- Gebruik hun woorden en energie
- Geen therapeutische clichés ("Ik begrijp het", "Dat moet moeilijk zijn")
- ${agency > 0.5 ? 'Stel één heldere vraag die uitnodigt' : 'Wees er vooral, geen vragen forceren'}
- ${autonomy > 0.5 ? 'Laat de keuze bij hen' : 'Bied een zachte suggestie, geen opdracht'}

Wees echt, niet therapeutisch.
`;
  
  return prompt;
}

export async function handleBiasCheck(userInput: string, aiResponse: string): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.error('❌ OPENAI_API_KEY not configured for bias check');
    return {
      biasReport: {
        detected: false,
        types: [],
        severity: 'low' as const,
        description: 'Bias check unavailable - API key missing',
        confidence: 0.0,
      },
      fallbackUsed: true,
    };
  }

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

  const userPrompt = `User Input: "${userInput}"
AI Response: "${aiResponse}"

Analyseer deze response op bias. Wees kritisch maar realistisch.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    let biasReport;
    try {
      biasReport = JSON.parse(content);
    } catch {
      biasReport = {
        detected: false,
        types: [],
        severity: 'low',
        description: 'Parse error',
        confidence: 0,
      };
    }

    return { biasReport, fallbackUsed: false };
  } catch (error) {
    console.error('🔴 Bias check error:', error);
    throw error; // Re-throw to trigger heuristic fallback
  }
}
