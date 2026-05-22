import { getCorpusCompanies } from '../../../db/queries/corpusCompanies';
import type { SourceConnector, SourcingQuery, RawSourceResult } from './types';

export class CorpusConnector implements SourceConnector {
  name = 'CorpusConnector';

  async search(query: SourcingQuery): Promise<RawSourceResult[]> {
    if (!query.corpusId) {
      throw new Error('CorpusConnector requires a corpusId');
    }

    const rows = getCorpusCompanies({
      corpusId: query.corpusId,
      sector: query.sector,
      workflowCategory: query.workflowCategory,
      limit: query.maxCompanies ?? 20,
    });

    return rows.map((row) => ({
      name: row.name,
      description: row.description,
      sector: row.sector,
      workflowCategory: row.workflowCategory,
      stage: row.stage,
      geography: row.geography,
      website: row.website,
      corpusCompanyId: row.id,
      prewrittenProfile: JSON.parse(row.profileJson),
    }));
  }
}
