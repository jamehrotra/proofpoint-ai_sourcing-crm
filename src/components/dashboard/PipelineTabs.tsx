import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PipelineTabsProps {
  active: 'pipeline' | 'passed';
  pipelineCount: number;
  passedCount: number;
}

export function PipelineTabs({ active, pipelineCount, passedCount }: PipelineTabsProps) {
  return (
    <div className="flex items-end gap-8 border-b border-[#e8e2d4] mb-6 -mt-2">
      <Tab href="/?view=pipeline" active={active === 'pipeline'} label="Pipeline" count={pipelineCount} />
      <Tab href="/?view=passed" active={active === 'passed'} label="Passed by AI" count={passedCount} />
    </div>
  );
}

function Tab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        'pb-3 -mb-px border-b-2 transition-colors flex items-baseline gap-2',
        active
          ? 'border-[#1a1816] text-[#1a1816]'
          : 'border-transparent text-[#6b6358] hover:text-[#1a1816]'
      )}
    >
      <span className="font-serif text-[18px] font-medium tracking-tight">{label}</span>
      <span
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.1em] px-1.5 py-[1px] rounded-sm',
          active ? 'bg-[#1a1816] text-[#faf7f2]' : 'bg-[#f5f1e8] text-[#6b6358] border border-[#e8e2d4]'
        )}
      >
        {count}
      </span>
    </Link>
  );
}
