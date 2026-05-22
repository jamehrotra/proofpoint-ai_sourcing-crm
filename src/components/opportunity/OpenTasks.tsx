'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw, X } from 'lucide-react';
import type { TaskRow } from '../../../db/queries/tasks';

interface OpenTasksProps {
  tasks: TaskRow[];
}

export function OpenTasks({ tasks }: OpenTasksProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (tasks.length === 0) return null;

  async function patchTask(id: string, done: boolean) {
    setBusyId(id);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTask(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const open = tasks.filter((t) => t.done === 0);
  const done = tasks.filter((t) => t.done === 1);

  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1816] border border-[#1a1816] rounded-sm px-1.5 py-[2px]">
          Human · Tasks
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Follow-Up Tasks</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {open.length} open · {done.length} done
        </span>
      </div>

      {open.length > 0 && (
        <ol className="space-y-3 mb-6">
          {open.map((task, i) => (
            <li key={task.id} className="flex items-start gap-3 group">
              <span className="font-mono text-[10px] text-[#6b1f2a] mt-1.5 shrink-0 w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 pt-0.5">
                <p className="font-serif text-[15px] text-[#1a1816] leading-[1.55]">{task.description}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] mt-1">
                  Added {formatDate(task.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => patchTask(task.id, true)}
                  disabled={busyId === task.id}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium border border-[#1e5631] text-[#1e5631] px-2.5 py-1 rounded-sm hover:bg-[#1e5631] hover:text-[#faf7f2] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> Done
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={busyId === task.id}
                  className="text-[#908874] hover:text-[#6b1f2a] transition-colors p-1 disabled:opacity-50"
                  aria-label="Delete task"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {done.length > 0 && (
        <div className="pt-5 border-t border-[#e8e2d4]">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-3">Completed</div>
          <ol className="space-y-2.5">
            {done.map((task, i) => (
              <li key={task.id} className="flex items-start gap-3 group">
                <span className="font-mono text-[10px] text-[#908874] mt-1.5 shrink-0 w-6">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 pt-0.5">
                  <p className="font-serif text-[14px] text-[#908874] line-through leading-[1.55]">{task.description}</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] mt-1">
                    Done {task.completedAt ? formatDate(task.completedAt) : ''}
                  </p>
                </div>
                <button
                  onClick={() => patchTask(task.id, false)}
                  disabled={busyId === task.id}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#1a1816] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" /> Reopen
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
