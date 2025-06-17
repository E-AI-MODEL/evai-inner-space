import { Message } from '../types';
import { SymbolicRule } from './useSymbolicEngine';
import { useDynamicRubricSymbolicRules } from './useDynamicRubricSymbolicRules';
import { useEnhancedRubricSymbolicRules } from './useEnhancedRubricSymbolicRules';

export function useRubricSymbolicRules() {
  const { dynamicRubricRules } = useDynamicRubricSymbolicRules();
  const { enhancedRubricBasedRules } = useEnhancedRubricSymbolicRules();

  const rubricBasedRules: SymbolicRule[] = [
    // Use the new dynamic rules instead of static ones
    ...dynamicRubricRules,
    
    // Add the enhanced personalized rules
    ...enhancedRubricBasedRules
  ];

  return { rubricBasedRules };
}
