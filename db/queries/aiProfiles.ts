import { getDb } from '../client';

export interface AIProfileRow {
  id: string;
  companyId: string;
  problem: string;
  customer: string;
  aiUseCase: string;
  dataMoatPotential: string;
  businessModel: string;
  fundingStage: string;
  competitiveLandscape: string;
  risks: string;
  extractedAt: string;
}

export function getProfileByCompanyId(companyId: string): AIProfileRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM ai_profiles WHERE companyId = ?').get(companyId) as AIProfileRow | undefined;
}

export function insertProfile(profile: AIProfileRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO ai_profiles (id, companyId, problem, customer, aiUseCase, dataMoatPotential, businessModel, fundingStage, competitiveLandscape, risks, extractedAt)
    VALUES (@id, @companyId, @problem, @customer, @aiUseCase, @dataMoatPotential, @businessModel, @fundingStage, @competitiveLandscape, @risks, @extractedAt)
  `).run(profile);
}
