import { describe, it, expect } from 'vitest';
import seeds from '../SeedTraceGraph_demo.json';
import { matchSeed } from '../SeedPatternMatcher';
import { compileReflection } from '../ReflectionCompiler';

// Cast loaded JSON to AdvancedSeed[]
const demoSeeds = seeds as any;

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
    const sample = { ...demoSeeds[0], response: { nl: 'Hallo {name}' } } as any;
    const text = compileReflection(sample, { name: 'Jan' });
    expect(text).toBe('Hallo Jan');
  });
});
