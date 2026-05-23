import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { insertNote } from '../../../../db/queries/notesLog';
import { getUsernameFromRequest } from '../../../lib/session';

const CreateNoteSchema = z.object({
  companyId: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid note', details: parsed.error.message }, { status: 400 });
    }

    const author = getUsernameFromRequest(request);

    const note = {
      id: nanoid(),
      companyId: parsed.data.companyId,
      body: parsed.data.body.trim(),
      createdAt: new Date().toISOString(),
      author,
    };
    insertNote(note);
    return NextResponse.json({ note });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
