import { getDb } from '../client';

export interface ScanRow {
  id: string;
  corpusId: string | null;
  sector: string;
  workflowCategory: string;
  thesisPrompt: string;
  mode: string;
  rawInput: string | null;
  createdAt: string;
}

export function insertScan(scan: ScanRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO sourcing_scans (id, corpusId, sector, workflowCategory, thesisPrompt, mode, rawInput, createdAt)
    VALUES (@id, @corpusId, @sector, @workflowCategory, @thesisPrompt, @mode, @rawInput, @createdAt)
  `).run(scan);
}

export function getScans(): ScanRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM sourcing_scans ORDER BY createdAt DESC').all() as ScanRow[];
}

export interface ScanWithCounts extends ScanRow {
  surfacedCount: number;
  passedCount: number;
  totalCount: number;
}

export function getScansWithCounts(): ScanWithCounts[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      s.*,
      COUNT(c.id) AS totalCount,
      COUNT(CASE WHEN tfa.recommendation IN ('Priority','Watch') THEN 1 END) AS surfacedCount,
      COUNT(CASE WHEN tfa.recommendation = 'Pass' THEN 1 END) AS passedCount
    FROM sourcing_scans s
    LEFT JOIN companies c ON c.scanId = s.id
    LEFT JOIN thesis_fit_analyses tfa ON tfa.companyId = c.id
    GROUP BY s.id
    ORDER BY s.createdAt DESC
  `).all() as ScanWithCounts[];
}

export function getScanById(id: string): ScanRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM sourcing_scans WHERE id = ?').get(id) as ScanRow | undefined;
}
