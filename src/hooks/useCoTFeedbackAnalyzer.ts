
import { useState } from 'react';
import { Message } from '../types';
import { useEvAI56Rubrics } from './useEvAI56Rubrics';

export interface CoTFeedbackPattern {
  emotion: string;
  label: string;
  successRate: number;
  commonFailures: string[];
  improvements: string[];
  rubricMapping: {
    rubricId: string;
    riskScore: number;
    protectiveScore: number;
  }[];
}

export function useCoTFeedbackAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { assessMessage, evai56Rubrics, getRubricById } = useEvAI56Rubrics();

  const analyzeCoTFeedback = async (
    messages: Message[],
    apiKey: string
  ): Promise<CoTFeedbackPattern[]> => {
    if (!apiKey || !apiKey.trim()) return [];

    setIsAnalyzing(true);
    console.log('🧠 EvAI-Enhanced CoT Feedback Analysis: Starting...');

    try {
      // Extract messages with feedback and analyze with EvAI rubrics
      const feedbackData = messages
        .filter(m => m.feedback && m.from === 'ai')
        .map(m => {
          const rubricAssessments = assessMessage(m.content);
          return {
            content: m.content,
            label: m.label,
            emotion: m.emotionSeed,
            feedback: m.feedback,
            reasoning: m.explainText || '',
            rubricAnalysis: rubricAssessments.map(assessment => ({
              rubricId: assessment.rubricId,
              rubricName: getRubricById(assessment.rubricId)?.name || assessment.rubricId,
              riskScore: assessment.riskScore,
              protectiveScore: assessment.protectiveScore,
              triggers: assessment.triggers
            }))
          };
        });

      if (feedbackData.length === 0) {
        console.log('📊 No feedback data available for EvAI CoT analysis');
        return [];
      }

      const prompt = `Analyseer deze AI conversatie feedback met EvAI 5.6 rubrics integratie voor enhanced Chain of Thought (CoT) learning:

EvAI 5.6 Rubrics Context:
${evai56Rubrics.map(r => `
- ${r.id}: ${r.name} (${r.category})
  Risk factors: ${r.riskFactors.join(', ')}
  Protective factors: ${r.protectiveFactors.join(', ')}
  Interventions: ${r.interventions.join(', ')}
`).join('\n')}

Enhanced Feedback Data met Rubrics:
${feedbackData.map(f => `
- Label: ${f.label}
- Emotie: ${f.emotion}
- Feedback: ${f.feedback}
- Redenering: ${f.reasoning}
- EvAI Rubrics: ${f.rubricAnalysis.map(r => `${r.rubricName}: Risk ${r.riskScore}, Protective ${r.protectiveScore}`).join('; ')}
- Content snippet: ${f.content.substring(0, 100)}...
`).join('\n')}

Geef een JSON array terug met EvAI-enhanced CoT leerpatronen:
[
  {
    "emotion": "emotie naam",
    "label": "label type", 
    "successRate": 0.85,
    "commonFailures": ["reden1", "reden2"],
    "improvements": ["verbetering1", "verbetering2"],
    "rubricMapping": [
      {
        "rubricId": "emotional-regulation",
        "riskScore": 2.3,
        "protectiveScore": 1.1
      }
    ]
  }
]

Focus op:
- Hoe rubrics correleren met succes/faal patronen
- Welke interventies het beste werken per rubric
- Concrete verbeteringen gebaseerd op rubric scores
- Patronen tussen emoties en rubric categorieën`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert in EvAI 5.6 rubrics-enhanced Chain of Thought (CoT) analyse voor therapeutische AI feedback. Geef alleen JSON arrays terug.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const patterns = JSON.parse(content);
        console.log('✅ EvAI-Enhanced CoT Feedback patterns analyzed:', patterns);
        return Array.isArray(patterns) ? patterns : [];
      } catch (parseError) {
        console.error('Failed to parse EvAI CoT feedback analysis:', parseError);
        return [];
      }

    } catch (error) {
      console.error('🔴 EvAI CoT Feedback analysis error:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCoTImprovements = async (
    patterns: CoTFeedbackPattern[],
    currentContext: string,
    apiKey: string
  ): Promise<string[]> => {
    if (!apiKey || patterns.length === 0) return [];

    try {
      const prompt = `Gebaseerd op deze EvAI-enhanced CoT feedback patronen, genereer rubrics-gevalideerde verbeteringen voor de huidige context:

EvAI CoT Patronen:
${patterns.map(p => `
- ${p.emotion} (${p.label}): ${(p.successRate * 100).toFixed(1)}% success
- Failures: ${p.commonFailures.join(', ')}
- Improvements: ${p.improvements.join(', ')}
- Rubric mapping: ${p.rubricMapping.map(r => `${r.rubricId}: Risk ${r.riskScore}, Protective ${r.protectiveScore}`).join('; ')}
`).join('\n')}

Huidige Context: "${currentContext}"

EvAI Rubrics Context voor validatie:
${evai56Rubrics.map(r => `${r.id}: ${r.interventions.join(', ')}`).join('\n')}

Geef een JSON array terug met specifieke, rubrics-gevalideerde verbeteringen:
["verbetering1", "verbetering2", "verbetering3"]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Je bent een EvAI rubrics-gevalideerde CoT verbetering specialist. Geef alleen JSON arrays terug met evidence-based interventies.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 250,
        }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const improvements = JSON.parse(content);
        return Array.isArray(improvements) ? improvements : [];
      } catch {
        return [];
      }

    } catch (error) {
      console.error('🔴 EvAI CoT improvements generation failed:', error);
      return [];
    }
  };

  return {
    analyzeCoTFeedback,
    generateCoTImprovements,
    isAnalyzing
  };
}
