interface ScanProgressProps {
  mode: 'search' | 'analyze';
  count?: number;
}

export function ScanProgress({ mode, count }: ScanProgressProps) {
  return (
    <div className="border border-[#e8e2d4] bg-[#faf7f2] py-16 px-8 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mb-3">In Progress</div>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.2s]" />
        <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.4s]" />
      </div>
      <p className="font-serif text-[20px] italic text-[#1a1816] mb-2">
        {mode === 'search'
          ? `Scoring ${count ?? 'matched companies'} against your thesis`
          : 'Extracting company profile and scoring thesis fit'}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
        AI is analyzing — approximately 10 to 30 seconds
      </p>
    </div>
  );
}
