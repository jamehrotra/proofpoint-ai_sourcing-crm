import { extractProfile } from '../ai/extract';
import type { SourceConnector, SourcingQuery, RawSourceResult } from './types';

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
        existingCompanyId: undefined,
      },
    ];
  }
}
