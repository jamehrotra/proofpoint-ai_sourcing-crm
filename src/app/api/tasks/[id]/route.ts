import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { markTaskDone, markTaskOpen, deleteTask } from '../../../../../db/queries/tasks';

const PatchSchema = z.object({
  done: z.boolean(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
    }

    if (parsed.data.done) {
      markTaskDone(id);
    } else {
      markTaskOpen(id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PATCH /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
