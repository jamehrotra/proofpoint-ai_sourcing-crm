import { getDb } from './client';
import { DEFAULT_BACKFILL_USERNAME } from '../src/lib/auth';

export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS sourcing_scans (
      id TEXT PRIMARY KEY,
      corpusId TEXT,
      sector TEXT NOT NULL,
      workflowCategory TEXT NOT NULL,
      thesisPrompt TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('search', 'analyze', 'web')),
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
      companyId TEXT NOT NULL REFERENCES companies(id),
      fitScore INTEGER NOT NULL CHECK(fitScore >= 0 AND fitScore <= 100),
      recommendation TEXT NOT NULL CHECK(recommendation IN ('Priority','Watch','Pass')),
      rationale TEXT NOT NULL,
      keyRisks TEXT NOT NULL,
      diligenceQuestions TEXT NOT NULL,
      nextStep TEXT NOT NULL,
      thesisPromptUsed TEXT NOT NULL,
      scoredAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_thesis_fit_company ON thesis_fit_analyses(companyId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_thesis_fit_company_prompt ON thesis_fit_analyses(companyId, thesisPromptUsed);

    CREATE TABLE IF NOT EXISTS review_decisions (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL UNIQUE REFERENCES companies(id),
      reviewerNotes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('New','Reviewing','Priority','Follow-Up','Pass')),
      nextStep TEXT NOT NULL DEFAULT '',
      aiRecommendation TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL REFERENCES companies(id),
      description TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      createdBy TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(companyId);
    CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done);

    CREATE TABLE IF NOT EXISTS sourcing_memos (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL UNIQUE REFERENCES companies(id),
      markdown TEXT NOT NULL,
      generatedAt TEXT NOT NULL,
      generatedBy TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS notes_log (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL REFERENCES companies(id),
      body TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_notes_log_company ON notes_log(companyId);
  `);

  /*
   * Migrate older DBs that were created before the author columns existed.
   * SQLite's ALTER TABLE ADD COLUMN is idempotent only via PRAGMA check, so we
   * inspect the table_info and conditionally add each column.
   */
  ensureColumn('notes_log', 'author', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('tasks', 'createdBy', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('sourcing_memos', 'generatedBy', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('companies', 'sourceUrl', 'TEXT');
  migrateSourcingScansMode();
  migrateThesisFitUniqueness();

  // Backfill empty author fields with the default user.
  const backfillUser = DEFAULT_BACKFILL_USERNAME;
  db.prepare(`UPDATE notes_log SET author = ? WHERE author = ''`).run(backfillUser);
  db.prepare(`UPDATE tasks SET createdBy = ? WHERE createdBy = ''`).run(backfillUser);
  db.prepare(`UPDATE sourcing_memos SET generatedBy = ? WHERE generatedBy = ''`).run(backfillUser);
}

function ensureColumn(table: string, column: string, columnType: string): void {
  const db = getDb();
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnType}`);
  }
}

/**
 * Older DBs created thesis_fit_analyses with UNIQUE on companyId, which prevents
 * storing multiple fit analyses per company (one per thesis). Detect and rebuild
 * the table without the UNIQUE if needed, then add a composite uniqueness index.
 */
/**
 * Older DBs created sourcing_scans with mode CHECK IN ('search','analyze').
 * Widen to include 'web' if needed.
 */
function migrateSourcingScansMode(): void {
  const db = getDb();
  const tableInfo = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='sourcing_scans'`)
    .get() as { sql: string } | undefined;
  if (!tableInfo) return;
  if (tableInfo.sql.includes("'web'")) return; // already migrated

  db.exec(`
    CREATE TABLE sourcing_scans_new (
      id TEXT PRIMARY KEY,
      corpusId TEXT,
      sector TEXT NOT NULL,
      workflowCategory TEXT NOT NULL,
      thesisPrompt TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('search', 'analyze', 'web')),
      rawInput TEXT,
      createdAt TEXT NOT NULL
    );
    INSERT INTO sourcing_scans_new SELECT * FROM sourcing_scans;
    DROP TABLE sourcing_scans;
    ALTER TABLE sourcing_scans_new RENAME TO sourcing_scans;
  `);
}

function migrateThesisFitUniqueness(): void {
  const db = getDb();
  const tableInfo = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='thesis_fit_analyses'`)
    .get() as { sql: string } | undefined;
  if (!tableInfo) return;

  const hasOldUnique = /companyId\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(tableInfo.sql);
  if (!hasOldUnique) return;

  // Rebuild without UNIQUE on companyId. SQLite-safe pattern: copy → drop → rename.
  db.exec(`
    CREATE TABLE thesis_fit_analyses_new (
      id TEXT PRIMARY KEY,
      companyId TEXT NOT NULL REFERENCES companies(id),
      fitScore INTEGER NOT NULL CHECK(fitScore >= 0 AND fitScore <= 100),
      recommendation TEXT NOT NULL CHECK(recommendation IN ('Priority','Watch','Pass')),
      rationale TEXT NOT NULL,
      keyRisks TEXT NOT NULL,
      diligenceQuestions TEXT NOT NULL,
      nextStep TEXT NOT NULL,
      thesisPromptUsed TEXT NOT NULL,
      scoredAt TEXT NOT NULL
    );
    INSERT INTO thesis_fit_analyses_new SELECT * FROM thesis_fit_analyses;
    DROP TABLE thesis_fit_analyses;
    ALTER TABLE thesis_fit_analyses_new RENAME TO thesis_fit_analyses;
    CREATE INDEX IF NOT EXISTS idx_thesis_fit_company ON thesis_fit_analyses(companyId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_thesis_fit_company_prompt ON thesis_fit_analyses(companyId, thesisPromptUsed);
  `);
}
