interface ScanProgressProps {
  mode: 'search' | 'analyze';
  count?: number;
}

export function ScanProgress({ mode, count }: ScanProgressProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-8 text-center bg-white">
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]" />
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]" />
      </div>
      <p className="text-sm font-medium text-gray-700">
        {mode === 'search'
          ? `Scoring ${count ?? 'companies'} against your thesis...`
          : 'Extracting company profile and scoring thesis fit...'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        AI is analyzing each company — this takes 10–30 seconds
      </p>
    </div>
  );
}
