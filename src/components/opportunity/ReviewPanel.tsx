'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Reviewer Notes</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="status" className="text-xs font-medium text-gray-500 mb-1.5 block">Status</Label>
          <Select value={status} onValueChange={(v) => { setStatus(v as WorkflowStatus); setSaved(false); }}>
            <SelectTrigger id="status" className="text-sm w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {aiRecommendation && (
            <div className="mt-1.5">
              <OverrideIndicator aiRecommendation={aiRecommendation} humanStatus={status} />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notes" className="text-xs font-medium text-gray-500 mb-1.5 block">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            placeholder="Add your observations, questions, or context..."
            rows={4}
            className="text-sm resize-none"
          />
        </div>

        <div>
          <Label htmlFor="nextStep" className="text-xs font-medium text-gray-500 mb-1.5 block">Next Step</Label>
          <Input
            id="nextStep"
            value={nextStep}
            onChange={(e) => { setNextStep(e.target.value); setSaved(false); }}
            placeholder="e.g. Schedule intro call with founder"
            className="text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-600">{error}</div>
      )}

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Decision'}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}
