
import seeds from "../seeds.json";

// Type van 1 seed
export interface Seed {
  emotion: string;
  triggers: string[];      // Woorden die als trigger werken
  response: string;        // Suggestie of validatie tekst van seed
  meta?: string;           // Optioneel, bv. prioriteit/ttl
}

// Functie om triggers te matchen
function matchSeed(input: string, seeds: Seed[]): Seed | null {
  const lowered = input.toLowerCase();
  for (const seed of seeds) {
    for (const trigger of seed.triggers) {
      if (lowered.includes(trigger.toLowerCase())) {
        return seed;
      }
    }
  }
  return null;
}

// De seed-engine hook
export function useSeedEngine() {
  // Eventueel kan je seeds fetchen of laten aanpassen, nu statisch
  const checkInput = (input: string) => matchSeed(input, seeds as Seed[]);
  return { checkInput };
}
