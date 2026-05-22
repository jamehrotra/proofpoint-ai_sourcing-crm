'use client';

import { cn } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

interface ModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex border border-[#1a1816] rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('search')}
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.08em] px-4 py-2 font-medium transition-colors',
          mode === 'search'
            ? 'bg-[#1a1816] text-[#faf7f2]'
            : 'bg-transparent text-[#1a1816] hover:bg-[#f5f1e8]'
        )}
      >
        Search for Companies
      </button>
      <button
        type="button"
        onClick={() => onChange('analyze')}
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.08em] px-4 py-2 font-medium border-l border-[#1a1816] transition-colors',
          mode === 'analyze'
            ? 'bg-[#1a1816] text-[#faf7f2]'
            : 'bg-transparent text-[#1a1816] hover:bg-[#f5f1e8]'
        )}
      >
        Analyze Given Data
      </button>
    </div>
  );
}
