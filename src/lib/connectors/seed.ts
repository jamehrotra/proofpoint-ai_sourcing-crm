import { getDb } from '../../../db/client';
import type { SourceConnector, SourcingQuery, RawSourceResult } from './types';

export class SeedDataConnector implements SourceConnector {
  name = 'SeedDataConnector';

  async search(query: SourcingQuery): Promise<RawSourceResult[]> {
    const db = getDb();

    let sql = `SELECT c.id, c.name, c.description, c.sector, c.workflowCategory, c.stage, c.geography, c.website
               FROM companies c
               WHERE c.sourceType = 'seed'`;
    const params: string[] = [];

    if (query.sector && query.sector !== 'Any') {
      sql += ' AND c.sector = ?';
      params.push(query.sector);
    }

    if (query.workflowCategory && query.workflowCategory !== 'Any') {
      sql += ' AND c.workflowCategory = ?';
      params.push(query.workflowCategory);
    }

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      name: string;
      description: string;
      sector: string;
      workflowCategory: string;
      stage: string;
      geography: string;
      website: string | null;
    }>;

    return rows.map((row) => ({
      name: row.name,
      description: row.description,
      sector: row.sector,
      workflowCategory: row.workflowCategory,
      stage: row.stage,
      geography: row.geography,
      website: row.website,
      existingCompanyId: row.id,
    }));
  }
}
