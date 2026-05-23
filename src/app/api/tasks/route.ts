import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { insertTask, getAllTasks } from '../../../../db/queries/tasks';
import { getUsernameFromRequest } from '../../../lib/session';

const CreateTaskSchema = z.object({
  companyId: z.string().min(1),
  description: z.string().min(1),
});

export async function GET() {
  try {
    const tasks = getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task', details: parsed.error.message }, { status: 400 });
    }

    const createdBy = getUsernameFromRequest(request);

    const task = {
      id: nanoid(),
      companyId: parsed.data.companyId,
      description: parsed.data.description.trim(),
      done: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
      createdBy,
    };

    insertTask(task);
    return NextResponse.json({ task });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
