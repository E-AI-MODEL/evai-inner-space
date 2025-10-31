// LLM Response Generator with v20 EAA constraints
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

function buildSystemPrompt(
  emotion: string,
  allowedInterventions: string[],
  eaaProfile: { ownership: number; autonomy: number; agency: number }
): string {
  const { ownership, autonomy, agency } = eaaProfile;
  
  let prompt = `Je bent een empathische AI-coach die helpt bij emotionele ondersteuning.

EMOTIONELE CONTEXT: ${emotion}

GEBRUIKER EAA-PROFIEL:
- Eigenaarschap (ownership): ${(ownership * 100).toFixed(0)}% - ${ownership > 0.6 ? 'Hoog: gebruiker voelt sterke verbinding' : ownership > 0.4 ? 'Gemiddeld: enige verbinding' : 'Laag: weinig persoonlijke betrokkenheid'}
- Autonomie: ${(autonomy * 100).toFixed(0)}% - ${autonomy > 0.5 ? 'Hoog: voelt keuzevrijheid' : autonomy > 0.3 ? 'Gemiddeld: enige autonomie' : 'Laag: weinig keuzevrijheid ervaren'}
- Agency: ${(agency * 100).toFixed(0)}% - ${agency > 0.6 ? 'Hoog: voelt handelingsbekwaamheid' : agency > 0.4 ? 'Gemiddeld: kan iets doen' : 'Laag: voelt machteloos'}

TOEGESTANE INTERVENTIES: ${allowedInterventions.join(', ')}

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
