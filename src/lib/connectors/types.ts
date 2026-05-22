export interface SourcingQuery {
  corpusId?: string;
  sector: string;
  workflowCategory: string;
  thesisPrompt: string;
  rawInput?: string;
  maxCompanies?: number;
}

export interface RawSourceResult {
  name: string;
  description: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string | null;
  corpusCompanyId?: string;
  prewrittenProfile?: {
    problem: string;
    customer: string;
    aiUseCase: string;
    dataMoatPotential: string;
    businessModel: string;
    fundingStage: string;
    competitiveLandscape: string;
    risks: string[];
  };
}

export interface SourceConnector {
  name: string;
  search(query: SourcingQuery): Promise<RawSourceResult[]>;
}
