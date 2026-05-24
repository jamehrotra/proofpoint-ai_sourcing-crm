'use client';

import { cn } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

interface ModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

const OPTIONS: Array<{ value: ScanMode; label: string }> = [
  { value: 'search', label: 'Search Corpus' },
  { value: 'analyze', label: 'Analyze Given Data' },
  { value: 'web', label: 'Search the Web' },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex border border-[#1a1816] rounded-sm overflow-hidden">
      {OPTIONS.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'font-mono text-[10px] uppercase tracking-[0.08em] px-4 py-2 font-medium transition-colors',
            mode === opt.value
              ? 'bg-[#1a1816] text-[#faf7f2]'
              : 'bg-transparent text-[#1a1816] hover:bg-[#f5f1e8]',
            i > 0 && 'border-l border-[#1a1816]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
