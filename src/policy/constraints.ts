/**
 * EvAI v16 - Z3 Constraint Layer
 * Formele verificatie van plannen tegen harde therapeutische/ethische constraints
 * Gebruikt Z3 SMT solver voor symbolische verificatie
 */

import { init } from 'z3-solver';

export interface ConstraintContext {
  rubric: {
    crisis: number;
    distress: number;
    support: number;
    coping: number;
  };
  seed: { 
    matchScore: number;
    emotion?: string;
  };
  plan?: { 
    strategy?: string;
    containsPII?: boolean;
    length?: number;
    interventions?: string[];
  };
}

export interface ConstraintResult {
  ok: boolean;
  reason: string;
  violations: string[];
  model?: any;
}

/**
 * 🔒 Check formele constraints met Z3 SMT solver
 * Returneert alleen 'sat' als alle constraints voldaan zijn
 */
export async function checkConstraints(ctx: ConstraintContext): Promise<ConstraintResult> {
  try {
    console.log('🔒 Z3 Constraint Solver: Verifying plan...');
    
    const { Context } = await init();
    const Z3 = Context('evai');

    // Converteer context naar Z3 integers
    const crisis = Z3.Int.val(ctx.rubric.crisis);
    const distress = Z3.Int.val(ctx.rubric.distress);
    const support = Z3.Int.val(ctx.rubric.support);
    const coping = Z3.Int.val(ctx.rubric.coping);
    
    const strategy = ctx.plan?.strategy ?? 'unknown';
    const selfHelp = Z3.Bool.val(strategy === 'self-help');
    const directAdvice = Z3.Bool.val(strategy === 'direct-advice');
    const refer = Z3.Bool.val(strategy === 'refer');
    const containsPII = Z3.Bool.val(!!ctx.plan?.containsPII);

    const solver = new Z3.Solver();
    const violations: string[] = [];

    // ===== HARDE CONSTRAINTS =====

    // CONSTRAINT 1: Geen zelfhulp bij crisis > 80
    solver.add(Z3.Implies(crisis.gt(80), selfHelp.not()));
    if (ctx.rubric.crisis > 80 && strategy === 'self-help') {
      violations.push('VIOLATION: Self-help verboden bij crisis > 80');
    }

    // CONSTRAINT 2: Bij distress > 70 moet coping OF support voldoende zijn
    solver.add(
      Z3.Implies(
        distress.gt(70),
        coping.gt(50).or(support.gt(50))
      )
    );
    if (ctx.rubric.distress > 70 && ctx.rubric.coping <= 50 && ctx.rubric.support <= 50) {
      violations.push('VIOLATION: Hoge distress zonder voldoende coping/support');
    }

    // CONSTRAINT 3: NOOIT PII in output
    solver.add(containsPII.not());
    if (ctx.plan?.containsPII) {
      violations.push('CRITICAL: PII detected in plan');
    }

    // CONSTRAINT 4: Direct advies alleen bij lage distress
    solver.add(Z3.Implies(directAdvice, distress.lt(40)));
    if (strategy === 'direct-advice' && ctx.rubric.distress >= 40) {
      violations.push('VIOLATION: Direct advies bij te hoge distress');
    }

    // CONSTRAINT 5: Bij crisis > 90 is verwijzing VERPLICHT
    solver.add(Z3.Implies(crisis.gt(90), refer));
    if (ctx.rubric.crisis > 90 && strategy !== 'refer') {
      violations.push('CRITICAL: Verwijzing verplicht bij crisis > 90');
    }

    // CONSTRAINT 6: Planlengte moet redelijk zijn
    if (ctx.plan?.length) {
      const planLength = Z3.Int.val(ctx.plan.length);
      solver.add(planLength.gt(10).and(planLength.lt(1000)));
      if (ctx.plan.length < 10 || ctx.plan.length > 1000) {
        violations.push('VIOLATION: Plan length buiten bereik (10-1000)');
      }
    }

    // Check satisfiability
    const res = await solver.check();
    const model = res === 'sat' ? solver.model() : null;

    const ok = res === 'sat' && violations.length === 0;

    if (ok) {
      console.log('✅ Z3 Constraints: All constraints SATISFIED');
    } else {
      console.error('❌ Z3 Constraints: VIOLATIONS found:', violations);
    }

    return {
      ok,
      reason: res,
      violations,
      model
    };

  } catch (error) {
    console.error('🔴 Z3 Constraint check failed:', error);
    // Fail-safe: bij error, blokkeer de response
    return {
      ok: false,
      reason: 'error',
      violations: [`Z3 error: ${error instanceof Error ? error.message : 'Unknown'}`]
    };
  }
}

/**
 * 🧪 Test constraint layer (voor development)
 */
export async function testConstraintLayer() {
  console.log('🧪 Testing Z3 Constraint Layer...');

  // Test 1: Crisis scenario
  const crisisCtx: ConstraintContext = {
    rubric: { crisis: 85, distress: 80, support: 40, coping: 30 },
    seed: { matchScore: 0.8 },
    plan: { strategy: 'self-help' }
  };
  const r1 = await checkConstraints(crisisCtx);
  console.log('Test 1 (should fail):', r1.ok ? 'PASS' : 'FAIL', r1.violations);

  // Test 2: Safe scenario
  const safeCtx: ConstraintContext = {
    rubric: { crisis: 30, distress: 35, support: 60, coping: 70 },
    seed: { matchScore: 0.9 },
    plan: { strategy: 'validation', containsPII: false, length: 150 }
  };
  const r2 = await checkConstraints(safeCtx);
  console.log('Test 2 (should pass):', r2.ok ? 'PASS' : 'FAIL', r2.violations);
}
