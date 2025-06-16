
import { useState } from 'react';
import { Message } from '../types';

export interface CoTFeedbackPattern {
  emotion: string;
  label: string;
  successRate: number;
  commonFailures: string[];
  improvements: string[];
}

export function useCoTFeedbackAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCoTFeedback = async (
    messages: Message[],
    apiKey: string
  ): Promise<CoTFeedbackPattern[]> => {
    if (!apiKey || !apiKey.trim()) return [];

    setIsAnalyzing(true);
    console.log('🧠 CoT Feedback Analysis: Starting...');

    try {
      // Extract messages with feedback
      const feedbackData = messages
        .filter(m => m.feedback && m.from === 'ai')
        .map(m => ({
          content: m.content,
          label: m.label,
          emotion: m.emotionSeed,
          feedback: m.feedback, // This is now just a string: "like" | "dislike"
          reasoning: m.explainText || ''
        }));

      if (feedbackData.length === 0) {
        console.log('📊 No feedback data available for CoT analysis');
        return [];
      }

      const prompt = `Analyseer deze AI conversatie feedback voor Chain of Thought (CoT) learning:

Feedback Data:
${feedbackData.map(f => `
- Label: ${f.label}
- Emotie: ${f.emotion}
- Feedback: ${f.feedback}
- Redenering: ${f.reasoning}
- Content snippet: ${f.content.substring(0, 100)}...
`).join('\n')}

Geef een JSON array terug met CoT leerpatronen:
[
  {
    "emotion": "emotie naam",
    "label": "label type", 
    "successRate": 0.85,
    "commonFailures": ["reden1", "reden2"],
    "improvements": ["verbetering1", "verbetering2"]
  }
]

Focus op:
- Wat werkt wel/niet per emotie en label
- Patronen in negatieve feedback
- Concrete verbeteringen voor toekomstige responses`;

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
              content: 'Je bent een expert in Chain of Thought (CoT) analyse voor therapeutische AI feedback. Geef alleen JSON arrays terug.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const patterns = JSON.parse(content);
        console.log('✅ CoT Feedback patterns analyzed:', patterns);
        return Array.isArray(patterns) ? patterns : [];
      } catch (parseError) {
        console.error('Failed to parse CoT feedback analysis:', parseError);
        return [];
      }

    } catch (error) {
      console.error('🔴 CoT Feedback analysis error:', error);
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
      const prompt = `Gebaseerd op deze CoT feedback patronen, genereer concrete verbeteringen voor de huidige context:

CoT Patronen:
${patterns.map(p => `
- ${p.emotion} (${p.label}): ${(p.successRate * 100).toFixed(1)}% success
- Failures: ${p.commonFailures.join(', ')}
- Improvements: ${p.improvements.join(', ')}
`).join('\n')}

Huidige Context: "${currentContext}"

Geef een JSON array terug met specifieke verbeteringen:
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
              content: 'Je bent een CoT verbetering specialist. Geef alleen JSON arrays terug.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 200,
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
      console.error('🔴 CoT improvements generation failed:', error);
      return [];
    }
  };

  return {
    analyzeCoTFeedback,
    generateCoTImprovements,
    isAnalyzing
  };
}
