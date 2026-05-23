import { getDb } from '../client';

export interface NoteLogRow {
  id: string;
  companyId: string;
  body: string;
  createdAt: string;
  author: string;
}

export function getNotesForCompany(companyId: string): NoteLogRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM notes_log WHERE companyId = ? ORDER BY createdAt DESC')
    .all(companyId) as NoteLogRow[];
}

export function insertNote(note: NoteLogRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO notes_log (id, companyId, body, createdAt, author)
    VALUES (@id, @companyId, @body, @createdAt, @author)
  `).run(note);
}

export function deleteNote(noteId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM notes_log WHERE id = ?').run(noteId);
}

export function deleteNotesByCompanyId(companyId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM notes_log WHERE companyId = ?').run(companyId);
}
