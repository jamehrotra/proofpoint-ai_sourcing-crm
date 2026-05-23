import { getDb } from '../client';

export interface CompanyRow {
  id: string;
  name: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string | null;
  description: string;
  status: string;
  sourceType: string;
  scanId: string | null;
  corpusCompanyId: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export interface CompanyWithFit extends CompanyRow {
  fitScore: number | null;
  recommendation: string | null;
  reviewStatus: string | null;
}

export interface CompanyFilters {
  search?: string;
  sector?: string;
  status?: string;
  recommendation?: string;
  view?: 'pipeline' | 'passed' | 'all';
  scanId?: string;
  sort?: string;
  dir?: string;
}

export function getCompanies(filters: CompanyFilters = {}): CompanyWithFit[] {
  const db = getDb();

  // Pull the *latest* thesis fit per company so the row never duplicates
  // when a company has been scored under multiple theses.
  let query = `
    SELECT c.*,
           tfa.fitScore,
           tfa.recommendation,
           rd.status as reviewStatus
    FROM companies c
    LEFT JOIN (
      SELECT t1.companyId, t1.fitScore, t1.recommendation
      FROM thesis_fit_analyses t1
      JOIN (
        SELECT companyId, MAX(scoredAt) AS maxScoredAt
        FROM thesis_fit_analyses
        GROUP BY companyId
      ) t2 ON t1.companyId = t2.companyId AND t1.scoredAt = t2.maxScoredAt
    ) tfa ON tfa.companyId = c.id
    LEFT JOIN review_decisions rd ON rd.companyId = c.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters.view === 'passed') {
    query += ` AND tfa.recommendation = 'Pass' AND c.status NOT IN ('Reviewing','Priority','Follow-Up')`;
  } else if (filters.view === 'pipeline') {
    query += ` AND (tfa.recommendation IN ('Priority','Watch') OR c.status IN ('Reviewing','Priority','Follow-Up')
              OR tfa.recommendation IS NULL)`;
  }

  if (filters.search) {
    query += ` AND (
      c.name LIKE ?
      OR c.description LIKE ?
      OR c.sector LIKE ?
      OR c.workflowCategory LIKE ?
      OR EXISTS (SELECT 1 FROM notes_log nl WHERE nl.companyId = c.id AND nl.body LIKE ?)
      OR EXISTS (SELECT 1 FROM sourcing_memos sm WHERE sm.companyId = c.id AND sm.markdown LIKE ?)
    )`;
    const term = `%${filters.search}%`;
    params.push(term, term, term, term, term, term);
  }

  if (filters.sector && filters.sector !== 'All') {
    query += ` AND c.sector = ?`;
    params.push(filters.sector);
  }

  if (filters.status && filters.status !== 'All') {
    query += ` AND c.status = ?`;
    params.push(filters.status);
  }

  if (filters.recommendation && filters.recommendation !== 'All') {
    query += ` AND tfa.recommendation = ?`;
    params.push(filters.recommendation);
  }

  if (filters.scanId) {
    query += ` AND c.scanId = ?`;
    params.push(filters.scanId);
  }

  const allowedSorts: Record<string, string> = {
    fitScore: 'tfa.fitScore',
    name: 'c.name',
    createdAt: 'c.createdAt',
    sector: 'c.sector',
    status: 'c.status',
  };
  const sortCol = allowedSorts[filters.sort ?? 'createdAt'] ?? 'c.createdAt';
  const dir = filters.dir === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${dir} NULLS LAST`;

  return db.prepare(query).all(...params) as CompanyWithFit[];
}

export function getCompanyById(id: string): CompanyRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as CompanyRow | undefined;
}

export function getCompanyByCorpusCompanyId(corpusCompanyId: string): CompanyRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE corpusCompanyId = ?').get(corpusCompanyId) as CompanyRow | undefined;
}

export function getCompanyBySourceUrl(sourceUrl: string): CompanyRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM companies WHERE sourceUrl = ? ORDER BY createdAt DESC LIMIT 1')
    .get(sourceUrl) as CompanyRow | undefined;
}

export function insertCompany(company: CompanyRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO companies (id, name, sector, workflowCategory, stage, geography, website, description, status, sourceType, scanId, corpusCompanyId, sourceUrl, createdAt)
    VALUES (@id, @name, @sector, @workflowCategory, @stage, @geography, @website, @description, @status, @sourceType, @scanId, @corpusCompanyId, @sourceUrl, @createdAt)
  `).run(company);
}

export function updateCompanyStatus(id: string, status: string): void {
  const db = getDb();
  db.prepare('UPDATE companies SET status = ? WHERE id = ?').run(status, id);
}

export function deleteCompanyCascade(id: string): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM tasks WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM notes_log WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM sourcing_memos WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM review_decisions WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM thesis_fit_analyses WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM ai_profiles WHERE companyId = ?').run(id);
    db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  });
  tx();
}

export function getCompanyCounts(): { pipeline: number; passed: number; total: number } {
  const db = getDb();
  const all = db.prepare(`
    SELECT c.status as cStatus, tfa.recommendation
    FROM companies c
    LEFT JOIN (
      SELECT t1.companyId, t1.recommendation
      FROM thesis_fit_analyses t1
      JOIN (
        SELECT companyId, MAX(scoredAt) AS maxScoredAt
        FROM thesis_fit_analyses
        GROUP BY companyId
      ) t2 ON t1.companyId = t2.companyId AND t1.scoredAt = t2.maxScoredAt
    ) tfa ON tfa.companyId = c.id
  `).all() as Array<{ cStatus: string; recommendation: string | null }>;

  let pipeline = 0;
  let passed = 0;
  for (const row of all) {
    const isPassed = row.recommendation === 'Pass'
      && !['Reviewing', 'Priority', 'Follow-Up'].includes(row.cStatus);
    if (isPassed) {
      passed++;
    } else {
      pipeline++;
    }
  }
  return { pipeline, passed, total: all.length };
}
