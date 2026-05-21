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

export function getFitByCompanyId(companyId: string): ThesisFitRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM thesis_fit_analyses WHERE companyId = ?').get(companyId) as ThesisFitRow | undefined;
}

export function upsertFit(fit: ThesisFitRow): void {
  const db = getDb();
  db.prepare('DELETE FROM thesis_fit_analyses WHERE companyId = ?').run(fit.companyId);
  db.prepare(`
    INSERT INTO thesis_fit_analyses (id, companyId, fitScore, recommendation, rationale, keyRisks, diligenceQuestions, nextStep, thesisPromptUsed, scoredAt)
    VALUES (@id, @companyId, @fitScore, @recommendation, @rationale, @keyRisks, @diligenceQuestions, @nextStep, @thesisPromptUsed, @scoredAt)
  `).run(fit);
}
