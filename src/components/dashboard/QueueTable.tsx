'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FitBadge } from './FitBadge';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';
import type { CompanyWithFit } from '@/lib/types';

interface QueueTableProps {
  companies: CompanyWithFit[];
}

type SortKey = 'name' | 'sector' | 'fitScore' | 'status' | 'createdAt';

export function QueueTable({ companies }: QueueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get('sort') ?? 'createdAt') as SortKey;
  const currentDir = searchParams.get('dir') ?? 'desc';

  function toggleSort(col: SortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === col) {
      params.set('dir', currentDir === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', col);
      params.set('dir', 'desc');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (currentSort !== col) return <ChevronDown className="inline w-3 h-3 text-gray-300 ml-1" />;
    return currentDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3 text-gray-500 ml-1" />
      : <ChevronDown className="inline w-3 h-3 text-gray-500 ml-1" />;
  }

  if (companies.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg py-16 text-center">
        <p className="text-sm text-gray-500">No companies match your filters.</p>
        <p className="text-xs text-gray-400 mt-1">
          Run a sourcing scan or clear your filters to see all companies.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="cursor-pointer select-none text-xs font-medium text-gray-500" onClick={() => toggleSort('name')}>
              Company <SortIcon col="name" />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-xs font-medium text-gray-500" onClick={() => toggleSort('sector')}>
              Sector <SortIcon col="sector" />
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Workflow</TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Stage</TableHead>
            <TableHead className="cursor-pointer select-none text-xs font-medium text-gray-500" onClick={() => toggleSort('fitScore')}>
              AI Fit <SortIcon col="fitScore" />
            </TableHead>
            <TableHead className="text-xs font-medium text-gray-500">Recommendation</TableHead>
            <TableHead className="cursor-pointer select-none text-xs font-medium text-gray-500" onClick={() => toggleSort('status')}>
              Status <SortIcon col="status" />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-xs font-medium text-gray-500" onClick={() => toggleSort('createdAt')}>
              Added <SortIcon col="createdAt" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/opportunity/${company.id}`)}>
              <TableCell>
                <Link
                  href={`/opportunity/${company.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-sm text-gray-900 hover:text-blue-600"
                >
                  {company.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{company.sector}</TableCell>
              <TableCell className="text-sm text-gray-500">{company.workflowCategory}</TableCell>
              <TableCell className="text-sm text-gray-500">{company.stage}</TableCell>
              <TableCell><FitBadge score={company.fitScore} /></TableCell>
              <TableCell>
                {company.recommendation ? (
                  <span className="text-sm text-gray-600">{company.recommendation}</span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell><StatusBadge status={company.status} /></TableCell>
              <TableCell className="text-xs text-gray-400">{formatDate(company.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
