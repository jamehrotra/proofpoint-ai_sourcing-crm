import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rewriteDiligenceAsAction } from '../../../../lib/ai/rewrite';

const RequestSchema = z.object({
  question: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const action = await rewriteDiligenceAsAction(parsed.data.question);
    return NextResponse.json({ action });
  } catch (error) {
    const err = error as Error;
    console.error('POST /api/ai/rewrite-diligence error:', err);
    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached, please wait a moment' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Rewrite failed', detail: err.message }, { status: 502 });
  }
}
