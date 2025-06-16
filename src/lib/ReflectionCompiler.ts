import { AdvancedSeed } from '../types/seed';

export function compileReflection(
  seed: AdvancedSeed,
  params: Record<string, string> = {}
): string {
  let text = seed.response.nl;
  for (const [key, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return text;
}
