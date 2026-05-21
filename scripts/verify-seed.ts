import { initSchema } from '../db/schema';
import { seedDatabase } from '../db/seed';
import { getDb } from '../db/client';

initSchema();
seedDatabase();

const db = getDb();

const companyCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
const profileCount = (db.prepare('SELECT COUNT(*) as count FROM ai_profiles').get() as { count: number }).count;

console.log(`Companies: ${companyCount} (expected 14)`);
console.log(`AI Profiles: ${profileCount} (expected 14)`);

if (companyCount !== 14 || profileCount !== 14) {
  console.error('Seed verification FAILED');
  process.exit(1);
} else {
  console.log('Seed verification PASSED');
}
