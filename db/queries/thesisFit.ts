import { getDb } from '../client';

export interface ThesisFitRow {
  id: string;
  companyId: string;
  fitScore: number;
  recommendation: string;
  rationale: string;
  keyRisks: string;
  diligenceQuestions: string;
  nextStep: string;
  thesisPromptUsed: string;
  scoredAt: string;
}

/**
 * Returns the most recent fit analysis for a company. The pipeline / detail-page
 * "headline" fit uses this — but the full Score History card uses
 * getAllFitsByCompanyId below.
 */
export function getFitByCompanyId(companyId: string): ThesisFitRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ? ORDER BY scoredAt DESC LIMIT 1')
    .get(companyId) as ThesisFitRow | undefined;
}

/**
 * Returns every saved fit analysis for a company, most recent first.
 */
export function getAllFitsByCompanyId(companyId: string): ThesisFitRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ? ORDER BY scoredAt DESC')
    .all(companyId) as ThesisFitRow[];
}

/**
 * Insert or replace per (companyId, thesisPromptUsed). Re-running the same thesis
 * on the same company overwrites; a different thesis is preserved alongside.
 */
export function upsertFit(fit: ThesisFitRow): void {
  const db = getDb();
  // Idempotent overwrite for the same (company, thesis) combination.
  db.prepare(
    'DELETE FROM thesis_fit_analyses WHERE companyId = ? AND thesisPromptUsed = ?'
  ).run(fit.companyId, fit.thesisPromptUsed);
  db.prepare(`
    INSERT INTO thesis_fit_analyses (id, companyId, fitScore, recommendation, rationale, keyRisks, diligenceQuestions, nextStep, thesisPromptUsed, scoredAt)
    VALUES (@id, @companyId, @fitScore, @recommendation, @rationale, @keyRisks, @diligenceQuestions, @nextStep, @thesisPromptUsed, @scoredAt)
  `).run(fit);
}
