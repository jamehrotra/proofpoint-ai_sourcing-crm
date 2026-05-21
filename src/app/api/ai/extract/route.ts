import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractProfile } from '../../../../lib/ai/extract';

const RequestSchema = z.object({
  rawText: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'rawText is required (min 10 chars)' }, { status: 400 });
    }

    const aiProfile = await extractProfile(result.data.rawText);
    return NextResponse.json({ aiProfile });
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('rate_limit') || err.message?.includes('429')) {
      return NextResponse.json({ error: 'Rate limit reached, please wait a moment' }, { status: 429 });
    }
    console.error('POST /api/ai/extract error:', err);
    return NextResponse.json({ error: 'AI extraction failed', detail: err.message }, { status: 502 });
  }
}
