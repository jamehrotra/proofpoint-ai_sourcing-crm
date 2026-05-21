'use client';

import { cn } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

interface ModeToggleProps {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange('search')}
        className={cn(
          'px-4 py-1.5 text-sm rounded-md transition-colors font-medium',
          mode === 'search'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        Search for Companies
      </button>
      <button
        type="button"
        onClick={() => onChange('analyze')}
        className={cn(
          'px-4 py-1.5 text-sm rounded-md transition-colors font-medium',
          mode === 'analyze'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        Analyze Given Data
      </button>
    </div>
  );
}
