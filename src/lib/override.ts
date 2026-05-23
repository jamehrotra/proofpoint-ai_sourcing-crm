import type { AIRecommendation, WorkflowStatus } from './types';

/**
 * Natural mapping: human statuses that "agree" with the AI recommendation —
 * i.e. the human hasn't really overridden the AI's call.
 */
const NATURAL: Record<AIRecommendation, WorkflowStatus[]> = {
  Priority: ['Priority', 'Reviewing', 'Follow-Up', 'New'],
  Watch: ['Reviewing', 'Follow-Up', 'New'],
  Pass: ['Pass', 'New'],
};

export function isOverride(
  aiRecommendation: AIRecommendation | null,
  humanStatus: WorkflowStatus
): boolean {
  if (!aiRecommendation) return false;
  return !NATURAL[aiRecommendation].includes(humanStatus);
}
