import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getCompanyById, updateCompanyStatus } from '../../../../../db/queries/companies';
import { upsertReview } from '../../../../../db/queries/reviewDecisions';

const ReviewSchema = z.object({
  reviewerNotes: z.string().default(''),
  status: z.enum(['New', 'Reviewing', 'Priority', 'Follow-Up', 'Pass']),
  nextStep: z.string().default(''),
  aiRecommendation: z.enum(['Priority', 'Watch', 'Pass']).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const company = getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = ReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.message }, { status: 400 });
    }

    const { reviewerNotes, status, nextStep, aiRecommendation } = result.data;

    upsertReview({
      id: nanoid(),
      companyId,
      reviewerNotes,
      status,
      nextStep,
      aiRecommendation: aiRecommendation ?? null,
      updatedAt: new Date().toISOString(),
    });

    updateCompanyStatus(companyId, status);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('PATCH /api/review/:companyId error:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}
