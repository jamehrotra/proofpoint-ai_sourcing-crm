import { getDb } from './client';

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS sourcing_scans (
      id TEXT PRIMARY KEY,
      corpusId TEXT,
      sector TEXT NOT NULL,
      workflowCategory TEXT NOT NULL,
      thesisPrompt TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('search', 'analyze')),
      rawInput TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corpus_companies (
      id TEXT PRIMARY KEY,
      corpusId TEXT NOT NULL,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      workflowCategory TEXT NOT NULL,
      stage TEXT NOT NULL,
      geography TEXT NOT NULL,
      website TEXT,
      description TEXT NOT NULL,
      profileJson TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_corpus_companies_corpus ON corpus_companies(corpusId);
    CREATE INDEX IF NOT EXISTS idx_corpus_companies_sector ON corpus_companies(sector);

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      workflowCategory TEXT NOT NULL,
      stage TEXT NOT NULL,
      geography TEXT NOT NULL,
      website TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Reviewing','Priority','Follow-Up','Pass')),
      sourceType TEXT NOT NULL CHECK(sourceType IN ('seed','ai-extracted','corpus')),
      scanId TEXT REFERENCES sourcing_scans(id),
      corpusCompanyId TEXT REFERENCES corpus_companies(id),
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_companies_corpus_company ON companies(corpusCompanyId);

    CREATE TABLE IF NOT EXISTS ai_profiles (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL UNIQUE REFERENCES companies(id),
      problem TEXT NOT NULL,
      customer TEXT NOT NULL,
      aiUseCase TEXT NOT NULL,
      dataMoatPotential TEXT NOT NULL,
      businessModel TEXT NOT NULL,
      fundingStage TEXT NOT NULL,
      competitiveLandscape TEXT NOT NULL,
      risks TEXT NOT NULL,
      extractedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thesis_fit_analyses (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL UNIQUE REFERENCES companies(id),
      fitScore INTEGER NOT NULL CHECK(fitScore >= 0 AND fitScore <= 100),
      recommendation TEXT NOT NULL CHECK(recommendation IN ('Priority','Watch','Pass')),
      rationale TEXT NOT NULL,
      keyRisks TEXT NOT NULL,
      diligenceQuestions TEXT NOT NULL,
      nextStep TEXT NOT NULL,
      thesisPromptUsed TEXT NOT NULL,
      scoredAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_decisions (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL UNIQUE REFERENCES companies(id),
      reviewerNotes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('New','Reviewing','Priority','Follow-Up','Pass')),
      nextStep TEXT NOT NULL DEFAULT '',
      aiRecommendation TEXT,
      updatedAt TEXT NOT NULL
    );
  `);
}
