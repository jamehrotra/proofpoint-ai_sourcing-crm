import { Badge } from '@/components/ui/badge';
import { fitScoreToLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FitBadgeProps {
  score: number | null;
}

export function FitBadge({ score }: FitBadgeProps) {
  const label = fitScoreToLabel(score);

  const styles = {
    'High Fit': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Medium Fit': 'bg-amber-50 text-amber-700 border-amber-200',
    'Low Fit': 'bg-red-50 text-red-700 border-red-200',
    'Unscored': 'bg-gray-50 text-gray-400 border-gray-200',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', styles[label])}>
      {label}
    </Badge>
  );
}
