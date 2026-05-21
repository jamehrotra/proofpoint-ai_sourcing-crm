import { NextRequest, NextResponse } from 'next/server';
import { getCompanies } from '../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../db/queries/aiProfiles';
import { getFitByCompanyId } from '../../../../db/queries/thesisFit';
import { getReviewByCompanyId } from '../../../../db/queries/reviewDecisions';
import type { CompanyWithFit } from '../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') ?? undefined,
      sector: searchParams.get('sector') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      recommendation: searchParams.get('recommendation') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      dir: searchParams.get('dir') ?? undefined,
    };

    const companies = getCompanies(filters);
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('GET /api/companies error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
