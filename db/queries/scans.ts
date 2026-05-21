import { getDb } from '../client';

export interface ScanRow {
  id: string;
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
    INSERT INTO sourcing_scans (id, sector, workflowCategory, thesisPrompt, mode, rawInput, createdAt)
    VALUES (@id, @sector, @workflowCategory, @thesisPrompt, @mode, @rawInput, @createdAt)
  `).run(scan);
}

export function getScans(): ScanRow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM sourcing_scans ORDER BY createdAt DESC').all() as ScanRow[];
}
