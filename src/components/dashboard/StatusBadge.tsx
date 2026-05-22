import { cn } from '@/lib/utils';
import type { WorkflowStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: WorkflowStatus | string;
  variant?: 'dot' | 'pill';
}

const STATUS_DOT: Record<string, string> = {
  'New': 'bg-[#0f1e3a]',
  'Reviewing': 'bg-[#b8893a]',
  'Priority': 'bg-[#1e5631]',
  'Follow-Up': 'bg-[#6b1f2a]',
  'Pass': 'bg-[#908874]',
};

const STATUS_PILL: Record<string, string> = {
  'New': 'text-[#0f1e3a] border-[#0f1e3a] bg-[#0f1e3a]/[0.05]',
  'Reviewing': 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  'Priority': 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
  'Follow-Up': 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
  'Pass': 'text-[#6b6358] border-[#e8e2d4] bg-[#f5f1e8]',
};

export function StatusBadge({ status, variant = 'dot' }: StatusBadgeProps) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-block font-mono text-[10px] uppercase tracking-[0.1em] font-medium border rounded-sm px-2 py-[3px]',
          STATUS_PILL[status] ?? 'text-[#6b6358] border-[#e8e2d4] bg-[#f5f1e8]'
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.08em] text-[#1a1816]">
      <span className={cn('inline-block w-[6px] h-[6px] rounded-full mr-2', STATUS_DOT[status] ?? 'bg-[#908874]')} />
      {status}
    </span>
  );
}
