import { cn } from '@/lib/utils';
import type { ThesisDimensions, DimensionVerdict } from '@/lib/types';

interface ThesisDimensionsCardProps {
  dimensions: ThesisDimensions;
}

const VERDICT_STYLE: Record<DimensionVerdict, string> = {
  Strong: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  Moderate: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Weak: 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
};

const ROWS: Array<{ key: keyof ThesisDimensions; label: string }> = [
  { key: 'sectorFit', label: 'Sector Fit' },
  { key: 'workflowOwnership', label: 'Workflow Ownership' },
  { key: 'dataMoat', label: 'Data Moat' },
  { key: 'stageAlignment', label: 'Stage Alignment' },
  { key: 'aiNative', label: 'AI-Native Architecture' },
];

export function ThesisDimensionsCard({ dimensions }: ThesisDimensionsCardProps) {
  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
          AI · Analysis
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Thesis Dimensions</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          AI&apos;s read on each thesis pillar
        </span>
      </div>

      <ol className="space-y-4">
        {ROWS.map((row, i) => {
          const dim = dimensions[row.key];
          return (
            <li key={row.key} className="grid grid-cols-[28px_180px_110px_1fr] items-start gap-4">
              <span className="font-mono text-[10px] text-[#6b1f2a] pt-1.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="pt-1">
                <p className="font-serif text-[16px] text-[#1a1816] tracking-tight">{row.label}</p>
              </div>
              <div>
                <span
                  className={cn(
                    'inline-block font-mono text-[10px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2 py-1',
                    VERDICT_STYLE[dim.verdict]
                  )}
                >
                  {dim.verdict}
                </span>
              </div>
              <p className="font-serif text-[14px] text-[#1a1816] leading-[1.55] pt-1">
                {dim.note}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
