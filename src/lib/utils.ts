import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FitLabel } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fitScoreToLabel(score: number | null): FitLabel {
  if (score === null) return 'Unscored';
  if (score >= 70) return 'High Fit';
  if (score >= 40) return 'Medium Fit';
  return 'Low Fit';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const SECTORS = ['Healthcare', 'Life Sciences', 'Financial Services'] as const;
export const WORKFLOW_CATEGORIES = [
  'Revenue Cycle',
  'Clinical Ops',
  'Prior Auth',
  'Value-Based Care',
  'Drug Discovery',
  'Lab Ops',
  'Clinical Finance',
  'Regulatory',
  'KYC',
  'Audit',
  'Compliance',
] as const;
export const WORKFLOW_STATUSES = ['New', 'Reviewing', 'Priority', 'Follow-Up', 'Pass'] as const;

