'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import type { TaskWithCompany } from '../../../db/queries/tasks';

interface TodoListProps {
  tasks: TaskWithCompany[];
}

type StatusGroup = 'Priority' | 'Follow-Up' | 'Reviewing' | 'New' | 'Pass';

const ORDER: StatusGroup[] = ['Priority', 'Follow-Up', 'Reviewing', 'New', 'Pass'];

const STATUS_STYLE: Record<StatusGroup, string> = {
  Priority: 'text-[#1e5631] border-[#1e5631]',
  'Follow-Up': 'text-[#6b1f2a] border-[#6b1f2a]',
  Reviewing: 'text-[#b8893a] border-[#b8893a]',
  New: 'text-[#0f1e3a] border-[#0f1e3a]',
  Pass: 'text-[#6b6358] border-[#e8e2d4]',
};

export function TodoList({ tasks }: TodoListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

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

  if (tasks.length === 0) {
    return (
      <div className="border-t border-b border-[#e8e2d4] py-20 text-center bg-[#faf7f2]">
        <p className="font-serif text-[20px] italic text-[#6b6358] mb-1">No follow-ups on the docket.</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">
          Add a next step on any company&rsquo;s detail page to create a task.
        </p>
      </div>
    );
  }

  const openTasks = tasks.filter((t) => t.done === 0);
  const doneTasks = tasks.filter((t) => t.done === 1);

  const grouped: Partial<Record<StatusGroup, TaskWithCompany[]>> = {};
  for (const t of openTasks) {
    const key = (ORDER as readonly string[]).includes(t.companyStatus)
      ? (t.companyStatus as StatusGroup)
      : 'New';
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(t);
  }

  return (
    <div className="border-t border-[#e8e2d4]">
      {ORDER.map((statusKey) => {
        const items = grouped[statusKey];
        if (!items || items.length === 0) return null;
        return (
          <div key={statusKey} className="border-b border-[#e8e2d4]">
            <div className={`flex items-baseline gap-3 py-4 px-1 border-b border-[#e8e2d4]`}>
              <span className={`font-mono text-[10px] uppercase tracking-[0.14em] font-medium border rounded-sm px-2 py-[3px] ${STATUS_STYLE[statusKey]}`}>
                {statusKey}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
                {items.length} {items.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <ol>
              {items.map((task, i) => (
                <li
                  key={task.id}
                  className="grid grid-cols-[40px_minmax(0,220px)_1fr_140px_140px] items-start gap-4 py-5 px-1 border-b border-[#e8e2d4] last:border-b-0 hover:bg-[#faf7f2] transition-colors"
                >
                  <span className="font-mono text-[10px] text-[#6b1f2a] pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <Link
                      href={`/opportunity/${task.companyId}`}
                      className="font-serif text-[16px] font-medium text-[#0f1e3a] hover:text-[#6b1f2a] tracking-tight transition-colors block"
                    >
                      {task.companyName}
                    </Link>
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#6b6358] mt-1">
                      {task.companySector}
                    </p>
                  </div>
                  <p className="font-serif text-[15px] text-[#1a1816] leading-[1.55]">
                    {task.description}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358] pt-1.5">
                    Added {formatDate(task.createdAt)}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
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
          </div>
        );
      })}

      {doneTasks.length > 0 && (
        <div className="border-b border-[#e8e2d4]">
          <div className="flex items-baseline gap-3 py-4 px-1 border-b border-[#e8e2d4]">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-medium border rounded-sm px-2 py-[3px] text-[#6b6358] border-[#e8e2d4]">
              Completed
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
              {doneTasks.length} {doneTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <ol>
            {doneTasks.map((task, i) => (
              <li
                key={task.id}
                className="grid grid-cols-[40px_minmax(0,220px)_1fr_140px_140px] items-start gap-4 py-5 px-1 border-b border-[#e8e2d4] last:border-b-0"
              >
                <span className="font-mono text-[10px] text-[#908874] pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <Link
                    href={`/opportunity/${task.companyId}`}
                    className="font-serif text-[16px] text-[#908874] line-through hover:text-[#6b1f2a] tracking-tight transition-colors block"
                  >
                    {task.companyName}
                  </Link>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] mt-1">
                    {task.companySector}
                  </p>
                </div>
                <p className="font-serif text-[15px] text-[#908874] line-through leading-[1.55]">
                  {task.description}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#908874] pt-1.5">
                  Done {task.completedAt ? formatDate(task.completedAt) : ''}
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => patchTask(task.id, false)}
                    disabled={busyId === task.id}
                    className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#1a1816] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" /> Reopen
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}
