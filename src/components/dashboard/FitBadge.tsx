import { fitScoreToLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FitBadgeProps {
  score: number | null;
  showScore?: boolean;
}

export function FitBadge({ score, showScore = false }: FitBadgeProps) {
  const label = fitScoreToLabel(score);

  const styles: Record<string, string> = {
    'High Fit': 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.06]',
    'Medium Fit': 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
    'Low Fit': 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
    'Unscored': 'text-[#6b6358] border-[#e8e2d4] bg-[#f5f1e8]',
  };

  const shortLabel: Record<string, string> = {
    'High Fit': 'High',
    'Medium Fit': 'Med',
    'Low Fit': 'Low',
    'Unscored': 'Unscored',
  };

  return (
    <span
      className={cn(
        'inline-block font-mono text-[10px] uppercase tracking-[0.1em] font-medium border rounded-sm px-2 py-[3px]',
        styles[label]
      )}
    >
      {showScore && score !== null ? `${shortLabel[label]} · ${score}` : label}
    </span>
  );
}
