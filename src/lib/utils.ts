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

export const SECTORS = ['Healthcare', 'Life Sciences', 'Financial Services', 'Cross-Sector'] as const;
export const WORKFLOW_CATEGORIES = [
  // Healthcare
  'Revenue Cycle',
  'Clinical Ops',
  'Clinical Documentation',
  'Clinical Decision Support',
  'Prior Auth',
  'Value-Based Care',
  'Patient Engagement',
  'Population Health',
  'Care Delivery',
  'Care Navigation',
  'Referral Intake',
  'Diagnostics',
  'Payer Operations',
  'Hospital Pharmacy Operations',
  // Life Sciences
  'Drug Discovery',
  'Lab Ops',
  'Clinical Finance',
  'Clinical Operations',
  'Real-World Data',
  'Health Data Exchange',
  // Financial Services
  'Regulatory',
  'KYC',
  'Audit',
  'Compliance',
  'Fraud',
  'Underwriting',
  'Insurance Underwriting',
  'Payments Operations',
  'Spend Management',
  'Tax Compliance',
  'Legal Automation',
  // Cross-sector
  'Knowledge Management',
  'Customer Support AI',
  'General Platform',
  'Defense AI',
] as const;
export const WORKFLOW_STATUSES = ['New', 'Reviewing', 'Priority', 'Follow-Up', 'Pass'] as const;

