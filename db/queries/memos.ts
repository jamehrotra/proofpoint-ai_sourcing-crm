import { getDb } from '../client';

export interface MemoRow {
  id: string;
  companyId: string;
  markdown: string;
  generatedAt: string;
  generatedBy: string;
}

export function getMemoByCompanyId(companyId: string): MemoRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM sourcing_memos WHERE companyId = ?').get(companyId) as MemoRow | undefined;
}

export function upsertMemo(memo: MemoRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO sourcing_memos (id, companyId, markdown, generatedAt, generatedBy)
    VALUES (@id, @companyId, @markdown, @generatedAt, @generatedBy)
    ON CONFLICT(companyId) DO UPDATE SET
      markdown = excluded.markdown,
      generatedAt = excluded.generatedAt,
      generatedBy = excluded.generatedBy
  `).run(memo);
}

export function deleteMemoByCompanyId(companyId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sourcing_memos WHERE companyId = ?').run(companyId);
}
