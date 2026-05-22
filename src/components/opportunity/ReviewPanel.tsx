'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OverrideIndicator } from './OverrideIndicator';
import { WORKFLOW_STATUSES } from '@/lib/utils';
import type { ReviewDecision, WorkflowStatus, AIRecommendation } from '@/lib/types';

interface ReviewPanelProps {
  companyId: string;
  initialReview: ReviewDecision | null;
  aiRecommendation: AIRecommendation | null;
}

export function ReviewPanel({ companyId, initialReview, aiRecommendation }: ReviewPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialReview?.reviewerNotes ?? '');
  const [status, setStatus] = useState<WorkflowStatus>(initialReview?.status ?? 'New');
  const [nextStep, setNextStep] = useState(initialReview?.nextStep ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/review/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerNotes: notes, status, nextStep, aiRecommendation }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border border-[#e8e2d4] bg-[#f5f1e8] p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1816] border border-[#1a1816] rounded-sm px-1.5 py-[2px]">
          Human · Review
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Reviewer Decision</h2>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as WorkflowStatus); setSaved(false); }}
            className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] focus:outline-none focus:border-[#1a1816]"
          >
            {WORKFLOW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {aiRecommendation && (
            <div className="mt-2">
              <OverrideIndicator aiRecommendation={aiRecommendation} humanStatus={status} />
            </div>
          )}
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">Next Step</label>
          <input
            value={nextStep}
            onChange={(e) => { setNextStep(e.target.value); setSaved(false); }}
            placeholder="e.g. Schedule intro call with founder"
            className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#1a1816]"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">Reviewer Notes</label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
          placeholder="Add your observations, questions, or context..."
          rows={5}
          className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#1a1816] resize-none"
        />
      </div>

      {error && (
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b1f2a] mb-3">Error · {error}</p>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-[#e8e2d4]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1a1816] text-[#faf7f2] px-5 py-2 text-[12px] font-medium tracking-[0.02em] hover:bg-[#0f1e3a] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Decision'}
        </button>
        {saved && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#1e5631]">Saved</span>
        )}
      </div>
    </section>
  );
}
