'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SECTORS, WORKFLOW_STATUSES } from '@/lib/utils';

export function QueueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'All') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const activeSector = searchParams.get('sector') ?? 'All';
  const activeStatus = searchParams.get('status') ?? 'All';
  const activeRec = searchParams.get('recommendation') ?? 'All';

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center gap-6">
        <input
          placeholder="Search companies, sectors, workflows..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            const w = window as typeof window & { _searchTimeout?: ReturnType<typeof setTimeout> };
            clearTimeout(w._searchTimeout);
            w._searchTimeout = setTimeout(() => updateParam('search', value), 300);
          }}
          className="flex-1 max-w-md bg-transparent border-0 border-b border-[#1a1816] px-0 py-2 text-[13px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#6b1f2a] transition-colors"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] shrink-0">Filter</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChipGroup label="Sector" active={activeSector} options={['All', ...SECTORS]} onSelect={(v) => updateParam('sector', v)} />
        <span className="text-[#d4cec0]">|</span>
        <FilterChipGroup label="Status" active={activeStatus} options={['All', ...WORKFLOW_STATUSES]} onSelect={(v) => updateParam('status', v)} />
        <span className="text-[#d4cec0]">|</span>
        <FilterChipGroup label="AI Rec" active={activeRec} options={['All', 'Priority', 'Watch', 'Pass']} onSelect={(v) => updateParam('recommendation', v)} />
      </div>
    </div>
  );
}

function FilterChipGroup({
  active,
  options,
  onSelect,
}: {
  label: string;
  active: string;
  options: readonly string[];
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={cn(
            'font-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-sm transition-colors border',
            active === opt
              ? 'bg-[#1a1816] text-[#faf7f2] border-[#1a1816]'
              : 'bg-[#f5f1e8] text-[#1a1816] border-[#e8e2d4] hover:border-[#1a1816]'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
