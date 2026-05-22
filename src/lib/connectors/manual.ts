import { extractProfile } from '../ai/extract';
import type { SourceConnector, SourcingQuery, RawSourceResult } from './types';

/**
 * ManualInputConnector — accepts pasted raw text. The scan API typically
 * calls extractProfile directly to keep the flow simple, but this connector
 * is retained as a reference implementation of the SourceConnector contract.
 */
export class ManualInputConnector implements SourceConnector {
  name = 'ManualInputConnector';

  async search(query: SourcingQuery): Promise<RawSourceResult[]> {
    if (!query.rawInput?.trim()) {
      return [];
    }

    const profile = await extractProfile(query.rawInput);

    return [
      {
        name: profile.companyName,
        description: query.rawInput.slice(0, 500),
        sector: profile.sector,
        workflowCategory: profile.workflowCategory,
        stage: profile.stageEstimate,
        geography: 'United States',
        website: null,
        prewrittenProfile: {
          problem: profile.problem,
          customer: profile.customer,
          aiUseCase: profile.aiUseCase,
          dataMoatPotential: profile.dataMoatPotential,
          businessModel: profile.businessModel ?? '',
          fundingStage: profile.fundingStage ?? profile.stageEstimate,
          competitiveLandscape: profile.competitiveLandscape ?? '',
          risks: profile.risks,
        },
      },
    ];
  }
}
