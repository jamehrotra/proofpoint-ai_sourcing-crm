export interface SourcingQuery {
  sector: string;
  workflowCategory: string;
  thesisPrompt: string;
  rawInput?: string;
}

export interface RawSourceResult {
  name: string;
  description: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string | null;
  existingCompanyId?: string;
}

export interface SourceConnector {
  name: string;
  search(query: SourcingQuery): Promise<RawSourceResult[]>;
}
