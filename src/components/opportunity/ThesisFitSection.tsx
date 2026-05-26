import { FitBadge } from '@/components/dashboard/FitBadge';
import { DiligenceQuestions } from './DiligenceQuestions';
import { cn } from '@/lib/utils';
import type { ThesisFitAnalysis } from '@/lib/types';

interface ThesisFitSectionProps {
  fit: ThesisFitAnalysis;
  companyId: string;
}

const REC_STYLES: Record<string, string> = {
  Priority: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  Watch: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Pass: 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
};

export function ThesisFitSection({ fit, companyId }: ThesisFitSectionProps) {
  return (
    <section className="border border-[#e8e2d4] bg-white p-10 mb-6">
      <div className="flex items-baseline gap-3 mb-8 pb-4 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
          AI · Analysis
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Thesis Fit</h2>
      </div>

      <div className="grid grid-cols-[auto_auto_1fr] gap-10 items-start mb-10 pb-10 border-b border-[#e8e2d4]">
        <div className="text-center">
          <div className="font-serif text-[64px] font-normal text-[#1a1816] leading-none">{fit.fitScore}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6358] mt-2">out of 100</div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <FitBadge score={fit.fitScore} showScore={false} />
          <span
            className={cn(
              'inline-block font-mono text-[10px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2.5 py-1.5 text-center',
              REC_STYLES[fit.recommendation]
            )}
          >
            AI Rec: {fit.recommendation}
          </span>
        </div>

        <div className="border-l border-[#e8e2d4] pl-10">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6358] mb-3">Rationale</div>
          <p className="font-serif text-[17px] italic text-[#1a1816] leading-[1.7]">{fit.rationale}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-14 mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-4">Key Risks</div>
          <ol className="space-y-3">
            {fit.keyRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-4 text-[15px] text-[#1a1816] leading-relaxed">
                <span className="font-mono text-[10px] text-[#6b1f2a] mt-1 shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
        <DiligenceQuestions companyId={companyId} questions={fit.diligenceQuestions} />
      </div>

      {fit.nextStep && (
        <div className="bg-[#f5f1e8] border-l-2 border-[#6b1f2a] px-6 py-5 mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a] mb-2">Recommended Next Step</div>
          <p className="text-[15px] text-[#1a1816] leading-relaxed">{fit.nextStep}</p>
        </div>
      )}

      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] pt-4 border-t border-[#e8e2d4]">
        Scored against thesis: <span className="font-serif text-[12px] italic normal-case tracking-normal text-[#6b6358]">&ldquo;{fit.thesisPromptUsed}&rdquo;</span>
      </p>
    </section>
  );
}
