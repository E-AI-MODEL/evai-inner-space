/**
 * Seed Database Cleanup Utility
 * Identifies and fixes overspecific seeds in the database
 */

import { supabase } from '@/integrations/supabase/client';
import { isResponseOverspecific } from './contextExtractor';

export interface CleanupReport {
  totalScanned: number;
  overspecificFound: number;
  fixed: number;
  deactivated: number;
  errors: string[];
}

/**
 * Scan database for overspecific seeds
 */
export async function scanForOverspecificSeeds(): Promise<CleanupReport> {
  const report: CleanupReport = {
    totalScanned: 0,
    overspecificFound: 0,
    fixed: 0,
    deactivated: 0,
    errors: []
  };

  try {
    // Query all active seeds from unified_knowledge
    const { data: seeds, error } = await supabase
      .from('unified_knowledge')
      .select('*')
      .eq('active', true);

    if (error) {
      report.errors.push(`Database query failed: ${error.message}`);
      return report;
    }

    if (!seeds || seeds.length === 0) {
      report.errors.push('No seeds found in database');
      return report;
    }

    report.totalScanned = seeds.length;
    console.log(`🔍 Scanning ${seeds.length} seeds for overspecific content...`);

    for (const seed of seeds) {
      const responseText = seed.response_text || '';
      const triggers = seed.triggers || [];

      // Check if response is overspecific
      if (isResponseOverspecific(responseText, triggers)) {
        report.overspecificFound++;
        console.warn(`⚠️ Overspecific seed found: ${seed.id}`);
        console.warn(`  Response: ${responseText.substring(0, 100)}...`);
        console.warn(`  Triggers: ${triggers.join(', ')}`);

        // Attempt to fix by replacing with generic version
        const fixResult = await attemptToFixSeed(seed);
        if (fixResult.success) {
          report.fixed++;
        } else if (fixResult.deactivated) {
          report.deactivated++;
        } else {
          report.errors.push(`Failed to fix seed ${seed.id}: ${fixResult.error}`);
        }
      }
    }

    console.log(`✅ Scan complete: ${report.overspecificFound} overspecific seeds found`);
    console.log(`   Fixed: ${report.fixed}, Deactivated: ${report.deactivated}`);

  } catch (error) {
    report.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return report;
}

/**
 * Attempt to fix an overspecific seed
 */
async function attemptToFixSeed(seed: any): Promise<{ success: boolean; deactivated: boolean; error?: string }> {
  try {
    const responseText = seed.response_text || '';
    
    // Try to replace overspecific patterns with template parameters
    let fixedResponse = responseText;
    
    const replacements = [
      { pattern: /\b(vannacht|gisteren|vanochtend|vanmiddag|vanavond)\b/gi, replacement: '{temporalRef}' },
      { pattern: /\b(na een goede nachtrust|na het slapen)\b/gi, replacement: 'nu' },
      { pattern: /\b(deze ochtend|deze middag|deze avond)\b/gi, replacement: '{timeOfDay}' },
      { pattern: /\b(vooral|specifiek|juist) na\b/gi, replacement: '' }
    ];

    let wasFixed = false;
    for (const { pattern, replacement } of replacements) {
      if (pattern.test(fixedResponse)) {
        fixedResponse = fixedResponse.replace(pattern, replacement);
        wasFixed = true;
      }
    }

    // Clean up extra spaces
    fixedResponse = fixedResponse.replace(/\s+/g, ' ').trim();
    fixedResponse = fixedResponse.replace(/\s+([,.])/g, '$1');

    if (wasFixed && fixedResponse.length > 20) {
      // Update the seed with fixed response
      const { error } = await supabase
        .from('unified_knowledge')
        .update({ 
          response_text: fixedResponse,
          updated_at: new Date().toISOString()
        })
        .eq('id', seed.id);

      if (error) {
        return { success: false, deactivated: false, error: error.message };
      }

      console.log(`✅ Fixed seed ${seed.id}`);
      console.log(`   Before: ${responseText}`);
      console.log(`   After: ${fixedResponse}`);
      return { success: true, deactivated: false };
    } else {
      // If we can't fix it properly, deactivate it
      const { error } = await supabase
        .from('unified_knowledge')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', seed.id);

      if (error) {
        return { success: false, deactivated: false, error: error.message };
      }

      console.log(`⏸️ Deactivated unfixable seed ${seed.id}`);
      return { success: false, deactivated: true };
    }

  } catch (error) {
    return { 
      success: false, 
      deactivated: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Manually deactivate specific seed by ID
 */
export async function deactivateSeed(seedId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('unified_knowledge')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', seedId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log(`✅ Manually deactivated seed ${seedId}`);
    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get list of potentially overspecific seeds (for review)
 */
export async function getOverspecificSeedsList(): Promise<any[]> {
  try {
    const { data: seeds, error } = await supabase
      .from('unified_knowledge')
      .select('*')
      .eq('active', true);

    if (error || !seeds) {
      console.error('Failed to query seeds:', error);
      return [];
    }

    const overspecific = seeds.filter(seed => {
      const responseText = seed.response_text || '';
      const triggers = seed.triggers || [];
      return isResponseOverspecific(responseText, triggers);
    });

    return overspecific;

  } catch (error) {
    console.error('Error getting overspecific seeds:', error);
    return [];
  }
}