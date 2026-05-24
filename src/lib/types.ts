export type WorkflowStatus = 'New' | 'Reviewing' | 'Priority' | 'Follow-Up' | 'Pass';
export type AIRecommendation = 'Priority' | 'Watch' | 'Pass';
export type FitLabel = 'High Fit' | 'Medium Fit' | 'Low Fit' | 'Unscored';
export type ScanMode = 'search' | 'analyze' | 'web';
export type SourceType = 'seed' | 'ai-extracted' | 'corpus';

export interface Company {
  id: string;
  name: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string | null;
  description: string;
  status: WorkflowStatus;
  sourceType: SourceType;
  scanId: string | null;
  createdAt: string;
}

export interface AIProfile {
  id: string;
  companyId: string;
  problem: string;
  customer: string;
  aiUseCase: string;
  dataMoatPotential: string;
  businessModel: string;
  fundingStage: string;
  competitiveLandscape: string;
  risks: string[];
  extractedAt: string;
}

export interface ThesisFitAnalysis {
  id: string;
  companyId: string;
  fitScore: number;
  recommendation: AIRecommendation;
  rationale: string;
  keyRisks: string[];
  diligenceQuestions: string[];
  nextStep: string;
  thesisPromptUsed: string;
  scoredAt: string;
}

export interface ReviewDecision {
  id: string;
  companyId: string;
  reviewerNotes: string;
  status: WorkflowStatus;
  nextStep: string;
  aiRecommendation: AIRecommendation | null;
  updatedAt: string;
}

export interface SourcingScan {
  id: string;
  sector: string;
  workflowCategory: string;
  thesisPrompt: string;
  mode: ScanMode;
  rawInput: string | null;
  createdAt: string;
}

export interface CompanyWithFit extends Company {
  fitScore: number | null;
  recommendation: AIRecommendation | null;
  reviewStatus: WorkflowStatus | null;
}

export interface CompanyDetail {
  company: Company;
  aiProfile: AIProfile | null;
  thesisFit: ThesisFitAnalysis | null;
  reviewDecision: ReviewDecision | null;
}

export interface AIProfileInput {
  companyName: string;
  sector: string;
  workflowCategory: string;
  customer: string;
  problem: string;
  aiUseCase: string;
  dataMoatPotential: string;
  stageEstimate: string;
  businessModel?: string;
  fundingStage?: string;
  competitiveLandscape?: string;
  risks: string[];
}

export interface ThesisFitInput {
  thesisFitScore: number;
  recommendation: AIRecommendation;
  rationale: string;
  keyRisks: string[];
  diligenceQuestions: string[];
  nextStep: string;
}

export interface ScanRequest {
  sector: string;
  workflowCategory: string;
  thesisPrompt: string;
  mode: ScanMode;
  rawInput?: string;
}

export interface ScanResult {
  scanId: string;
  companies: CompanyWithFit[];
  warnings: string[];
}
