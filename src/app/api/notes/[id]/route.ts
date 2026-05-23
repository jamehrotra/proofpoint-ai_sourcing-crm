import { NextRequest, NextResponse } from 'next/server';
import { deleteNote } from '../../../../../db/queries/notesLog';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteNote(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/notes error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
