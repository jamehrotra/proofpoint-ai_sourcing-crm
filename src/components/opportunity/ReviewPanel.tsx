'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { WORKFLOW_STATUSES } from '@/lib/utils';
import type { ReviewDecision, WorkflowStatus, AIRecommendation } from '@/lib/types';

interface ReviewPanelProps {
  companyId: string;
  initialReview: ReviewDecision | null;
  aiRecommendation: AIRecommendation | null;
}

export function ReviewPanel({ companyId, initialReview, aiRecommendation }: ReviewPanelProps) {
  return (
    <section className="border border-[#e8e2d4] bg-[#f5f1e8] p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1816] border border-[#1a1816] rounded-sm px-1.5 py-[2px]">
          Human · Review
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Reviewer Actions</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatusBlock
          companyId={companyId}
          initialStatus={initialReview?.status ?? 'New'}
          aiRecommendation={aiRecommendation}
        />

        <Divider />

        <TaskBlock companyId={companyId} />

        <Divider />

        <NoteBlock companyId={companyId} />
      </div>
    </section>
  );
}

function Divider() {
  return <div className="border-t border-[#e8e2d4]" />;
}

function ActionHeader({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a]">{eyebrow}</span>
        <h3 className="font-serif text-[18px] text-[#1a1816] tracking-tight">{title}</h3>
      </div>
      {hint && (
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874]">{hint}</p>
      )}
    </div>
  );
}

function Confirmation({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#1e5631] inline-flex items-center gap-1">
      <Check className="w-3 h-3" />
      {message}
    </span>
  );
}

function StatusBlock({
  companyId,
  initialStatus,
  aiRecommendation,
}: {
  companyId: string;
  initialStatus: WorkflowStatus;
  aiRecommendation: AIRecommendation | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<WorkflowStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: WorkflowStatus) {
    setStatus(next);
    setSaving(true);
    setError(null);
    setConfirmation(null);
    try {
      const res = await fetch(`/api/review/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, aiRecommendation }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save status.');
        return;
      }
      setConfirmation('Status updated');
      router.refresh();
      setTimeout(() => setConfirmation(null), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
      <ActionHeader
        eyebrow="Action 01"
        title="Set Status"
        hint="Updates the Your Status field at the top. Auto-saves on change."
      />
      <div className="max-w-md">
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as WorkflowStatus)}
          disabled={saving}
          className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] focus:outline-none focus:border-[#1a1816] disabled:opacity-50"
        >
          {WORKFLOW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="mt-2 h-4">
          {saving && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358]">Saving...</span>
          )}
          {!saving && <Confirmation message={confirmation} />}
          {error && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a]">Error · {error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskBlock({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setError('Please enter a task description.');
      return;
    }
    setSaving(true);
    setError(null);
    setConfirmation(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, description: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to add task.');
        return;
      }
      setText('');
      setConfirmation('Task added to To Do');
      router.refresh();
      setTimeout(() => setConfirmation(null), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
      <ActionHeader
        eyebrow="Action 02"
        title="Add Next Step"
        hint="Creates a new follow-up task. View all in the To Do tab."
      />
      <div className="max-w-2xl">
        <div className="flex gap-3">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="e.g. Schedule intro call with founder"
            className="flex-1 bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#1a1816]"
          />
          <button
            onClick={handleAdd}
            disabled={saving || text.trim().length === 0}
            className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium bg-[#1a1816] text-[#faf7f2] px-4 py-2 hover:bg-[#0f1e3a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm shrink-0"
          >
            {saving ? 'Adding...' : 'Add Task'}
          </button>
        </div>
        <div className="mt-2 h-4">
          <Confirmation message={confirmation} />
          {error && (
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a]">Error · {error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteBlock({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setError('Please enter a note.');
      return;
    }
    setSaving(true);
    setError(null);
    setConfirmation(null);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to add note.');
        return;
      }
      setText('');
      setConfirmation('Note added to journal');
      router.refresh();
      setTimeout(() => setConfirmation(null), 3000);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
      <ActionHeader
        eyebrow="Action 03"
        title="Add Journal Note"
        hint="Appends a timestamped entry to the Reviewer Journal below. Previous notes are preserved."
      />
      <div className="max-w-2xl">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(null); }}
          placeholder="Add your observations, questions, or context — saved as a timestamped journal entry."
          rows={4}
          className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#1a1816] resize-none"
        />
        <div className="mt-2 flex items-center gap-3 justify-between">
          <div className="h-4 flex items-center">
            <Confirmation message={confirmation} />
            {error && (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a]">Error · {error}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || text.trim().length === 0}
            className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium bg-[#1a1816] text-[#faf7f2] px-4 py-2 hover:bg-[#0f1e3a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm shrink-0"
          >
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
