import { FitBadge } from '@/components/dashboard/FitBadge';
import { cn } from '@/lib/utils';
import type { ThesisFitAnalysis } from '@/lib/types';

interface ScoreHistoryProps {
  fits: ThesisFitAnalysis[];
}

const REC_STYLES: Record<string, string> = {
  Priority: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  Watch: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Pass: 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
};

export function ScoreHistory({ fits }: ScoreHistoryProps) {
  if (fits.length <= 1) return null;

  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
          AI · Analysis
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Score History</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {fits.length} thesis evaluations
        </span>
      </div>

      <ol className="space-y-5">
        {fits.map((fit, i) => (
          <li key={fit.id} className="grid grid-cols-[40px_auto_auto_1fr_120px] items-start gap-5">
            <span className="font-mono text-[10px] text-[#6b1f2a] mt-1 pt-2">
              {String(fits.length - i).padStart(2, '0')}
            </span>
            <div className="text-center pt-1">
              <div className="font-serif text-[32px] font-normal text-[#1a1816] leading-none">{fit.fitScore}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6358] mt-0.5">/ 100</div>
            </div>
            <div className="flex flex-col gap-1.5 pt-2 shrink-0">
              <FitBadge score={fit.fitScore} showScore={false} />
              <span
                className={cn(
                  'inline-block font-mono text-[10px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2 py-[3px] text-center',
                  REC_STYLES[fit.recommendation]
                )}
              >
                {fit.recommendation}
              </span>
            </div>
            <div className="pt-1">
              <p className="font-serif text-[14px] italic text-[#1a1816] leading-[1.5] line-clamp-2">
                &ldquo;{fit.thesisPromptUsed}&rdquo;
              </p>
              <p className="mt-2 font-serif text-[13px] text-[#6b6358] leading-[1.55]">
                {fit.rationale}
              </p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358] pt-2 text-right">
              {formatDate(fit.scoredAt)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase();
}
