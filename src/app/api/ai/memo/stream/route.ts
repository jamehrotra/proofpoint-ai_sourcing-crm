import { NextRequest } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getCompanyById } from '../../../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../../../db/queries/aiProfiles';
import { getFitByCompanyId } from '../../../../../../db/queries/thesisFit';
import { upsertMemo, getMemoByCompanyId } from '../../../../../../db/queries/memos';
import { streamMemo } from '../../../../../lib/ai/memo';
import { getUsernameFromRequest } from '../../../../../lib/session';
import type {
  AIProfile,
  ThesisFitAnalysis,
  WorkflowStatus,
  SourceType,
} from '../../../../../lib/types';

const RequestSchema = z.object({
  companyId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'companyId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { companyId } = parsed.data;
  const company = getCompanyById(companyId);
  if (!company) {
    return new Response(JSON.stringify({ error: 'Company not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profileRow = getProfileByCompanyId(companyId);
  const fitRow = getFitByCompanyId(companyId);

  if (!profileRow) {
    return new Response(
      JSON.stringify({ error: 'Company has no AI profile — run a scan first' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!fitRow) {
    return new Response(
      JSON.stringify({ error: 'Company has no thesis-fit analysis — run a scan first' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const aiProfile: AIProfile = { ...profileRow, risks: JSON.parse(profileRow.risks) };
  const thesisFit: ThesisFitAnalysis = {
    ...fitRow,
    keyRisks: JSON.parse(fitRow.keyRisks),
    diligenceQuestions: JSON.parse(fitRow.diligenceQuestions),
    recommendation: fitRow.recommendation as 'Priority' | 'Watch' | 'Pass',
  };

  const companyTyped = {
    ...company,
    status: company.status as WorkflowStatus,
    sourceType: company.sourceType as SourceType,
  };

  const generatedBy = getUsernameFromRequest(request);

  // Build the readable stream — pipes Claude's text deltas straight to the client,
  // then persists the full markdown to the DB once the stream completes.
  const encoder = new TextEncoder();
  let fullText = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamMemo(companyTyped, aiProfile, thesisFit)) {
          fullText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        // Persist on completion.
        const now = new Date().toISOString();
        const existing = getMemoByCompanyId(companyId);
        upsertMemo({
          id: existing?.id ?? nanoid(),
          companyId,
          markdown: fullText,
          generatedAt: now,
          generatedBy,
        });
        controller.close();
      } catch (err) {
        console.error('Streaming memo error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // hint to disable proxy buffering
    },
  });
}
