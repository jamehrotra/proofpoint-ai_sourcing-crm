import { getDb } from '../client';

export interface TaskRow {
  id: string;
  companyId: string;
  description: string;
  done: number;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskWithCompany extends TaskRow {
  companyName: string;
  companySector: string;
  companyStatus: string;
}

export function insertTask(task: TaskRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO tasks (id, companyId, description, done, createdAt, completedAt)
    VALUES (@id, @companyId, @description, @done, @createdAt, @completedAt)
  `).run(task);
}

export function getTasksForCompany(companyId: string, includeDone = true): TaskRow[] {
  const db = getDb();
  const sql = includeDone
    ? 'SELECT * FROM tasks WHERE companyId = ? ORDER BY done ASC, createdAt DESC'
    : 'SELECT * FROM tasks WHERE companyId = ? AND done = 0 ORDER BY createdAt DESC';
  return db.prepare(sql).all(companyId) as TaskRow[];
}

export function getAllTasks(): TaskWithCompany[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, c.name as companyName, c.sector as companySector, c.status as companyStatus
    FROM tasks t
    JOIN companies c ON c.id = t.companyId
    ORDER BY t.done ASC, t.createdAt DESC
  `).all() as TaskWithCompany[];
}

export function markTaskDone(taskId: string): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET done = 1, completedAt = ? WHERE id = ?')
    .run(new Date().toISOString(), taskId);
}

export function markTaskOpen(taskId: string): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET done = 0, completedAt = NULL WHERE id = ?').run(taskId);
}

export function deleteTask(taskId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}

export function countOpenTasks(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done = 0').get() as { count: number };
  return row.count;
}
