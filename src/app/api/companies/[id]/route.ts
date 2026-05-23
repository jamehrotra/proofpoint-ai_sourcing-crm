import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, deleteCompanyCascade } from '../../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../../db/queries/aiProfiles';
import { getFitByCompanyId } from '../../../../../db/queries/thesisFit';
import { getReviewByCompanyId } from '../../../../../db/queries/reviewDecisions';
import type { AIProfile, ThesisFitAnalysis, ReviewDecision } from '../../../../lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const profileRow = getProfileByCompanyId(id);
    const fitRow = getFitByCompanyId(id);
    const reviewRow = getReviewByCompanyId(id);

    const aiProfile: AIProfile | null = profileRow
      ? { ...profileRow, risks: JSON.parse(profileRow.risks) }
      : null;

    const thesisFit: ThesisFitAnalysis | null = fitRow
      ? {
          ...fitRow,
          keyRisks: JSON.parse(fitRow.keyRisks),
          diligenceQuestions: JSON.parse(fitRow.diligenceQuestions),
          recommendation: fitRow.recommendation as 'Priority' | 'Watch' | 'Pass',
        }
      : null;

    const reviewDecision: ReviewDecision | null = reviewRow
      ? {
          ...reviewRow,
          status: reviewRow.status as ReviewDecision['status'],
          aiRecommendation: reviewRow.aiRecommendation as ReviewDecision['aiRecommendation'],
        }
      : null;

    return NextResponse.json({
      company: { ...company, status: company.status as string },
      aiProfile,
      thesisFit,
      reviewDecision,
    });
  } catch (error) {
    console.error('GET /api/companies/:id error:', error);
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    deleteCompanyCascade(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/companies/:id error:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}
