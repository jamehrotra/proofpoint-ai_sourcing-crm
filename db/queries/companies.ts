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
  sort?: string;
  dir?: string;
}

export function getCompanies(filters: CompanyFilters = {}): CompanyWithFit[] {
  const db = getDb();

  let query = `
    SELECT c.*,
           tfa.fitScore,
           tfa.recommendation,
           rd.status as reviewStatus
    FROM companies c
    LEFT JOIN thesis_fit_analyses tfa ON tfa.companyId = c.id
    LEFT JOIN review_decisions rd ON rd.companyId = c.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters.search) {
    query += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.sector LIKE ? OR c.workflowCategory LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
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

export function insertCompany(company: Omit<CompanyRow, 'status'> & { status: string }): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO companies (id, name, sector, workflowCategory, stage, geography, website, description, status, sourceType, scanId, createdAt)
    VALUES (@id, @name, @sector, @workflowCategory, @stage, @geography, @website, @description, @status, @sourceType, @scanId, @createdAt)
  `).run(company);
}

export function updateCompanyStatus(id: string, status: string): void {
  const db = getDb();
  db.prepare('UPDATE companies SET status = ? WHERE id = ?').run(status, id);
}
