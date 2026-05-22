import { NextResponse } from 'next/server';
import { CORPORA } from '../../../../db/corpora';
import { getCorpusCounts } from '../../../../db/queries/corpusCompanies';

export async function GET() {
  try {
    const counts = getCorpusCounts();
    const corpora = CORPORA.map((c) => ({
      id: c.id,
      label: c.label,
      description: c.description,
      companyCount: counts[c.id] ?? c.companies.length,
    }));
    return NextResponse.json({ corpora });
  } catch (error) {
    console.error('GET /api/corpora error:', error);
    return NextResponse.json({ error: 'Failed to fetch corpora' }, { status: 500 });
  }
}
