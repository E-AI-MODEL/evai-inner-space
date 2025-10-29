import { AdvancedSeed } from '../types/seed';

/**
 * Compile template response with extracted context parameters
 * Replaces {placeholders} with actual context from user input
 */
export function compileReflection(
  seed: AdvancedSeed,
  params: Record<string, string> = {}
): string {
  let text = seed.response.nl;
  
  // Replace all template parameters
  for (const [key, value] of Object.entries(params)) {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    text = text.replace(placeholder, value);
  }
  
  // Remove any unreplaced placeholders (fallback to generic)
  text = text.replace(/\{timeOfDay\}/g, 'nu');
  text = text.replace(/\{situation\}/g, 'in deze situatie');
  text = text.replace(/\{recentEvent\}/g, 'recent');
  text = text.replace(/\{temporalRef\}/g, 'op dit moment');
  
  return text;
}

/**
 * Check if a seed response contains template parameters
 */
export function hasTemplateParameters(seed: AdvancedSeed): boolean {
  return /\{[a-zA-Z_]+\}/.test(seed.response.nl);
}
