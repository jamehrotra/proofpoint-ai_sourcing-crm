import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getCompanyById } from '../../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../../db/queries/aiProfiles';
import { getFitByCompanyId } from '../../../../../db/queries/thesisFit';
import { upsertMemo, getMemoByCompanyId } from '../../../../../db/queries/memos';
import { generateMemo } from '../../../../lib/ai/memo';
import { getUsernameFromRequest } from '../../../../lib/session';
import type { AIProfile, ThesisFitAnalysis } from '../../../../lib/types';

const RequestSchema = z.object({
  companyId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const { companyId } = result.data;
    const company = getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const profileRow = getProfileByCompanyId(companyId);
    const fitRow = getFitByCompanyId(companyId);

    if (!profileRow) {
      return NextResponse.json({ error: 'Company has no AI profile — run a scan first' }, { status: 422 });
    }
    if (!fitRow) {
      return NextResponse.json({ error: 'Company has no thesis-fit analysis — run a scan first' }, { status: 422 });
    }

    const aiProfile: AIProfile = { ...profileRow, risks: JSON.parse(profileRow.risks) };
    const thesisFit: ThesisFitAnalysis = {
      ...fitRow,
      keyRisks: JSON.parse(fitRow.keyRisks),
      diligenceQuestions: JSON.parse(fitRow.diligenceQuestions),
      recommendation: fitRow.recommendation as 'Priority' | 'Watch' | 'Pass',
      dimensions: fitRow.dimensionsJson ? JSON.parse(fitRow.dimensionsJson) : null,
      sourceUrls: fitRow.sourceUrlsJson ? JSON.parse(fitRow.sourceUrlsJson) : null,
    };

    const memo = await generateMemo(
      {
        ...company,
        status: company.status as import('../../../../lib/types').WorkflowStatus,
        sourceType: company.sourceType as import('../../../../lib/types').SourceType,
      },
      aiProfile,
      thesisFit
    );

    const now = new Date().toISOString();
    const existing = getMemoByCompanyId(companyId);
    const generatedBy = getUsernameFromRequest(request);
    upsertMemo({
      id: existing?.id ?? nanoid(),
      companyId,
      markdown: memo,
      generatedAt: now,
      generatedBy,
    });

    return NextResponse.json({ memo, generatedAt: now, generatedBy });
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached, please wait a moment' }, { status: 429 });
    }
    console.error('POST /api/ai/memo error:', err);
    return NextResponse.json({ error: 'Memo generation failed', detail: err.message }, { status: 502 });
  }
}
