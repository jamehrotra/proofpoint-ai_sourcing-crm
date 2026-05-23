'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

interface DiligenceQuestionsProps {
  companyId: string;
  questions: string[];
}

export function DiligenceQuestions({ companyId, questions }: DiligenceQuestionsProps) {
  const router = useRouter();
  // Tracks per-question status: 'idle' | 'adding' | 'added'
  const [statuses, setStatuses] = useState<Record<number, 'idle' | 'adding' | 'added'>>({});

  async function addAsTask(index: number, question: string) {
    setStatuses((s) => ({ ...s, [index]: 'adding' }));
    try {
      // 1. Ask Claude to rewrite the diligence question as an actionable task.
      let description = question;
      try {
        const rewriteRes = await fetch('/api/ai/rewrite-diligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
        if (rewriteRes.ok) {
          const data = await rewriteRes.json();
          if (typeof data.action === 'string' && data.action.trim().length > 0) {
            description = data.action.trim();
          }
        }
        // If rewrite fails for any reason, fall through with the original question —
        // better to save *something* than block the user.
      } catch {
        // network or parse failure — fall through with original question
      }

      // 2. Save the (rewritten or fallback) task.
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, description }),
      });
      if (!res.ok) {
        setStatuses((s) => ({ ...s, [index]: 'idle' }));
        return;
      }
      setStatuses((s) => ({ ...s, [index]: 'added' }));
      router.refresh();
    } catch {
      setStatuses((s) => ({ ...s, [index]: 'idle' }));
    }
  }

  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-3">
        Diligence Questions
      </div>
      <ol className="space-y-2.5">
        {questions.map((q, i) => {
          const status = statuses[i] ?? 'idle';
          return (
            <li key={i} className="flex items-start gap-3 text-[14px] text-[#1a1816] leading-relaxed group">
              <span className="font-mono text-[10px] text-[#6b1f2a] mt-1 shrink-0 w-5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1">{q}</span>
              <button
                onClick={() => addAsTask(i, q)}
                disabled={status !== 'idle'}
                className={
                  status === 'added'
                    ? 'shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-[#1e5631] inline-flex items-center gap-1 mt-0.5'
                    : 'shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] font-medium text-[#6b6358] hover:text-[#1a1816] inline-flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40'
                }
              >
                {status === 'added' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Added
                  </>
                ) : status === 'adding' ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Add as task
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
