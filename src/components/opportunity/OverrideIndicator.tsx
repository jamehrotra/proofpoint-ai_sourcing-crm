interface OverrideIndicatorProps {
  aiRecommendation: string;
  humanStatus: string;
}

export function OverrideIndicator({ aiRecommendation, humanStatus }: OverrideIndicatorProps) {
  if (aiRecommendation === humanStatus) return null;

  return (
    <p className="text-xs text-gray-400 italic">
      AI recommended: {aiRecommendation} &mdash; You set: {humanStatus}
    </p>
  );
}
