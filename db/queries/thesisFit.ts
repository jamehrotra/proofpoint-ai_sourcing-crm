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
  /** JSON-encoded ThesisDimensions object (nullable for older rows). */
  dimensionsJson: string | null;
  /** JSON-encoded string[] of URLs Claude evaluated for this scoring (nullable). */
  sourceUrlsJson: string | null;
}

export function getFitByCompanyAndThesis(companyId: string, thesisPrompt: string): ThesisFitRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ? AND thesisPromptUsed = ? LIMIT 1')
    .get(companyId, thesisPrompt) as ThesisFitRow | undefined;
}

export function getFitByCompanyId(companyId: string): ThesisFitRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ? ORDER BY scoredAt DESC LIMIT 1')
    .get(companyId) as ThesisFitRow | undefined;
}

export function getAllFitsByCompanyId(companyId: string): ThesisFitRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ? ORDER BY scoredAt DESC')
    .all(companyId) as ThesisFitRow[];
}

export function upsertFit(fit: ThesisFitRow): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM thesis_fit_analyses WHERE companyId = ? AND thesisPromptUsed = ?'
  ).run(fit.companyId, fit.thesisPromptUsed);
  db.prepare(`
    INSERT INTO thesis_fit_analyses (
      id, companyId, fitScore, recommendation, rationale, keyRisks,
      diligenceQuestions, nextStep, thesisPromptUsed, scoredAt,
      dimensionsJson, sourceUrlsJson
    )
    VALUES (
      @id, @companyId, @fitScore, @recommendation, @rationale, @keyRisks,
      @diligenceQuestions, @nextStep, @thesisPromptUsed, @scoredAt,
      @dimensionsJson, @sourceUrlsJson
    )
  `).run(fit);
}
