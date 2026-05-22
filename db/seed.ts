import { nanoid } from 'nanoid';
import { getDb } from './client';
import { CORPORA } from './corpora';

export function seedDatabase() {
  const db = getDb();

  const corpusCount = (db.prepare('SELECT COUNT(*) as count FROM corpus_companies').get() as { count: number }).count;
  if (corpusCount > 0) {
    return;
  }

  const insertCorpusCompany = db.prepare(`
    INSERT INTO corpus_companies (id, corpusId, name, sector, workflowCategory, stage, geography, website, description, profileJson)
    VALUES (@id, @corpusId, @name, @sector, @workflowCategory, @stage, @geography, @website, @description, @profileJson)
  `);

  const seedAll = db.transaction(() => {
    for (const corpus of CORPORA) {
      for (const company of corpus.companies) {
        insertCorpusCompany.run({
          id: nanoid(),
          corpusId: corpus.id,
          name: company.name,
          sector: company.sector,
          workflowCategory: company.workflowCategory,
          stage: company.stage,
          geography: company.geography,
          website: company.website,
          description: company.description,
          profileJson: JSON.stringify(company.profile),
        });
      }
    }
  });

  seedAll();
}
