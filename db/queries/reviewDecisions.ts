import { getDb } from '../client';

export interface ReviewDecisionRow {
  id: string;
  companyId: string;
  reviewerNotes: string;
  status: string;
  nextStep: string;
  aiRecommendation: string | null;
  updatedAt: string;
}

export function getReviewByCompanyId(companyId: string): ReviewDecisionRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM review_decisions WHERE companyId = ?').get(companyId) as ReviewDecisionRow | undefined;
}

export function upsertReview(review: ReviewDecisionRow): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO review_decisions (id, companyId, reviewerNotes, status, nextStep, aiRecommendation, updatedAt)
    VALUES (@id, @companyId, @reviewerNotes, @status, @nextStep, @aiRecommendation, @updatedAt)
    ON CONFLICT(companyId) DO UPDATE SET
      reviewerNotes = excluded.reviewerNotes,
      status = excluded.status,
      nextStep = excluded.nextStep,
      aiRecommendation = excluded.aiRecommendation,
      updatedAt = excluded.updatedAt
  `).run(review);
}
