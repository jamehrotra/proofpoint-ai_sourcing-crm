import { getDb } from '../client';

export interface CorpusCompanyRow {
  id: string;
  corpusId: string;
  name: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string | null;
  description: string;
  profileJson: string;
}

export interface CorpusCompanyFilters {
  corpusId: string;
  sector?: string;
  workflowCategory?: string;
  limit?: number;
}

export function getCorpusCompanies(filters: CorpusCompanyFilters): CorpusCompanyRow[] {
  const db = getDb();
  let sql = 'SELECT * FROM corpus_companies WHERE corpusId = ?';
  const params: unknown[] = [filters.corpusId];

  if (filters.sector && filters.sector !== 'Any') {
    sql += ' AND sector = ?';
    params.push(filters.sector);
  }

  if (filters.workflowCategory && filters.workflowCategory !== 'Any') {
    sql += ' AND workflowCategory = ?';
    params.push(filters.workflowCategory);
  }

  sql += ' ORDER BY name ASC';

  if (filters.limit && filters.limit > 0) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  return db.prepare(sql).all(...params) as CorpusCompanyRow[];
}

export function getCorpusCounts(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(
    'SELECT corpusId, COUNT(*) as count FROM corpus_companies GROUP BY corpusId'
  ).all() as Array<{ corpusId: string; count: number }>;

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.corpusId] = row.count;
  }
  return result;
}
