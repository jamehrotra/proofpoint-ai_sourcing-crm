'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Input
        placeholder="Search companies..."
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          clearTimeout((window as typeof window & { _searchTimeout?: ReturnType<typeof setTimeout> })._searchTimeout);
          (window as typeof window & { _searchTimeout?: ReturnType<typeof setTimeout> })._searchTimeout = setTimeout(() => updateParam('search', value), 300);
        }}
        className="w-56 h-8 text-sm"
      />

      <Select defaultValue={searchParams.get('sector') || 'All'} onValueChange={(v) => v && updateParam('sector', v)}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="Sector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Sectors</SelectItem>
          {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get('status') || 'All'} onValueChange={(v) => v && updateParam('status', v)}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Statuses</SelectItem>
          {WORKFLOW_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get('recommendation') || 'All'} onValueChange={(v) => v && updateParam('recommendation', v)}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="AI Fit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Fit</SelectItem>
          <SelectItem value="Priority">Priority</SelectItem>
          <SelectItem value="Watch">Watch</SelectItem>
          <SelectItem value="Pass">Pass</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
