export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSchema } = await import('./db/schema');
    const { seedDatabase } = await import('./db/seed');
    initSchema();
    seedDatabase();
  }
}
