import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scoreThesisFit, type ProfileLike } from '../../../../lib/ai/score';

const RequestSchema = z.object({
  aiProfile: z.record(z.string(), z.unknown()),
  thesisPrompt: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'aiProfile and thesisPrompt are required' }, { status: 400 });
    }

    const thesisFit = await scoreThesisFit(result.data.aiProfile as ProfileLike, result.data.thesisPrompt);
    return NextResponse.json({ thesisFit });
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached, please wait a moment' }, { status: 429 });
    }
    console.error('POST /api/ai/score error:', err);
    return NextResponse.json({ error: 'AI scoring failed', detail: err.message }, { status: 502 });
  }
}
