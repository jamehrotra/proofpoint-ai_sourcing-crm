'use client';

import { cn } from '@/lib/utils';

export interface CorpusOption {
  id: string;
  label: string;
  description: string;
  companyCount: number;
}

interface CorpusPickerProps {
  corpora: CorpusOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CorpusPicker({ corpora, selectedId, onSelect }: CorpusPickerProps) {
  if (corpora.length === 0) {
    return (
      <div className="text-[13px] text-[#6b6358] italic font-serif">No corpora loaded yet — restart the server to seed.</div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {corpora.map((c) => {
        const active = selectedId === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              'text-left border p-4 transition-colors rounded-sm',
              active
                ? 'border-[#1a1816] bg-[#1a1816] text-[#faf7f2]'
                : 'border-[#e8e2d4] bg-white text-[#1a1816] hover:border-[#1a1816]'
            )}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-serif text-[18px] tracking-tight">{c.label}</span>
              <span
                className={cn(
                  'font-mono text-[10px] uppercase tracking-[0.1em] px-1.5 py-[2px] rounded-sm',
                  active ? 'bg-[#faf7f2] text-[#1a1816]' : 'bg-[#f5f1e8] text-[#6b6358] border border-[#e8e2d4]'
                )}
              >
                {c.companyCount}
              </span>
            </div>
            <p
              className={cn(
                'text-[12px] leading-relaxed',
                active ? 'text-[#faf7f2]/80' : 'text-[#6b6358]'
              )}
            >
              {c.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
