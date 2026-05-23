import { ArrowRight } from 'lucide-react';
import { isOverride } from '@/lib/override';
import { fitScoreToLabel } from '@/lib/utils';
import type { AIRecommendation, WorkflowStatus } from '@/lib/types';

interface VerdictBarProps {
  aiRecommendation: AIRecommendation | null;
  aiFitScore: number | null;
  humanStatus: WorkflowStatus;
}

const VERDICT_STYLE: Record<AIRecommendation, string> = {
  Priority: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  Watch: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Pass: 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
};

const STATUS_STYLE: Record<WorkflowStatus, string> = {
  New: 'text-[#0f1e3a] border-[#0f1e3a] bg-[#0f1e3a]/[0.05]',
  Reviewing: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Priority: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  'Follow-Up': 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
  Pass: 'text-[#6b6358] border-[#e8e2d4] bg-[#f5f1e8]',
};

export function VerdictBar({ aiRecommendation, aiFitScore, humanStatus }: VerdictBarProps) {
  const overridden = isOverride(aiRecommendation, humanStatus);
  const fitLabel = fitScoreToLabel(aiFitScore);
  const fitText = aiFitScore !== null
    ? `${fitLabel === 'Unscored' ? 'Unscored' : fitLabel.replace(' Fit', '')} · ${aiFitScore}`
    : 'Unscored';

  return (
    <div className="mb-8 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-6 border-y border-[#e8e2d4] py-4">
      <div className="flex items-center gap-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] shrink-0">
          AI · Verdict
        </div>
        {aiRecommendation ? (
          <div className="flex items-center gap-2">
            <span className={`inline-block font-mono text-[11px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2 py-1 ${VERDICT_STYLE[aiRecommendation]}`}>
              {aiRecommendation}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
              {fitText}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874] italic">
            Not yet scored
          </span>
        )}
      </div>

      <ArrowRight className="w-4 h-4 text-[#d4cec0]" />

      <div className="flex items-center gap-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1816] shrink-0">
          Your · Status
        </div>
        <span className={`inline-block font-mono text-[11px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2 py-1 ${STATUS_STYLE[humanStatus]}`}>
          {humanStatus}
        </span>
      </div>

      <div className="shrink-0">
        {overridden ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] font-semibold border border-[#1a1816] bg-[#1a1816] text-[#faf7f2] rounded-sm px-2 py-1">
            Override
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874] italic">
            No override
          </span>
        )}
      </div>
    </div>
  );
}
