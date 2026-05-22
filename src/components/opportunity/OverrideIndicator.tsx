interface OverrideIndicatorProps {
  aiRecommendation: string;
  humanStatus: string;
}

export function OverrideIndicator({ aiRecommendation, humanStatus }: OverrideIndicatorProps) {
  if (aiRecommendation === humanStatus) return null;

  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">
      AI recommended: <span className="text-[#6b6358]">{aiRecommendation}</span> &mdash; You set: <span className="text-[#1a1816]">{humanStatus}</span>
    </p>
  );
}
