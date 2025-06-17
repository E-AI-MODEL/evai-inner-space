
import { describe, it, expect } from 'vitest';
import seeds from '../SeedTraceGraph_demo.json';
import { matchSeed } from '../SeedPatternMatcher';
import { compileReflection } from '../ReflectionCompiler';
import type { AdvancedSeed } from '../../types/seed';

// Cast loaded JSON to AdvancedSeed[] with proper date conversion
const demoSeeds = seeds.map(seed => ({
  ...seed,
  createdAt: new Date(seed.createdAt),
  updatedAt: new Date(seed.updatedAt)
})) as AdvancedSeed[];

describe('SeedPatternMatcher', () => {
  it('matches sadness related input', () => {
    const seed = matchSeed('Ik voel me heel verdrietig vandaag.', demoSeeds);
    expect(seed?.id).toBe('seed1');
  });

  it('matches anger related input', () => {
    const seed = matchSeed('Ik ben echt boos!', demoSeeds);
    expect(seed?.id).toBe('seed2');
  });

  it('returns null when no match', () => {
    const seed = matchSeed('Ik voel me geweldig!', demoSeeds);
    expect(seed).toBeNull();
  });
});

describe('ReflectionCompiler', () => {
  it('replaces placeholders in response', () => {
    const sample: AdvancedSeed = { ...demoSeeds[0], response: { nl: 'Hallo {name}' } };
    const text = compileReflection(sample, { name: 'Jan' });
    expect(text).toBe('Hallo Jan');
  });
});
