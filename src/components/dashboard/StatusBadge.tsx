import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkflowStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: WorkflowStatus | string;
  size?: 'sm' | 'default';
}

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Reviewing': 'bg-purple-50 text-purple-700 border-purple-200',
  'Priority': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Follow-Up': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pass': 'bg-gray-50 text-gray-500 border-gray-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-400 border-gray-200';
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', style)}>
      {status}
    </Badge>
  );
}
