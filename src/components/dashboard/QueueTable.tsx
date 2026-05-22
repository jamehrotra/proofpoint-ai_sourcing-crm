'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { FitBadge } from './FitBadge';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import type { CompanyWithFit } from '@/lib/types';

interface QueueTableProps {
  companies: CompanyWithFit[];
  view: 'pipeline' | 'passed';
}

type SortKey = 'name' | 'sector' | 'fitScore' | 'status' | 'createdAt';

const REC_STYLES: Record<string, string> = {
  Priority: 'text-[#1e5631] font-medium',
  Watch: 'text-[#b8893a] font-medium',
  Pass: 'text-[#6b1f2a] font-medium',
};

export function QueueTable({ companies, view }: QueueTableProps) {
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
    if (currentSort !== col) return <ChevronDown className="inline w-3 h-3 text-[#d4cec0] ml-1" />;
    return currentDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3 text-[#1a1816] ml-1" />
      : <ChevronDown className="inline w-3 h-3 text-[#1a1816] ml-1" />;
  }

  if (companies.length === 0) {
    const empty = view === 'passed'
      ? {
          title: 'No companies passed by AI yet.',
          subtitle: 'After a scan runs, low-fit companies appear here for review.',
        }
      : {
          title: 'No companies in the pipeline.',
          subtitle: 'Run a sourcing scan from the New Scan page to surface companies.',
        };

    return (
      <div className="border-t border-b border-[#e8e2d4] py-20 text-center bg-[#faf7f2]">
        <p className="font-serif text-[20px] italic text-[#6b6358] mb-1">{empty.title}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">{empty.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[#e8e2d4]">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-[#1a1816]">
            <ThSort label="Company" col="name" current={currentSort} onClick={toggleSort} SortIcon={SortIcon} />
            <ThSort label="Sector" col="sector" current={currentSort} onClick={toggleSort} SortIcon={SortIcon} />
            <Th label="Workflow" />
            <Th label="Stage" />
            <ThSort label="AI Fit" col="fitScore" current={currentSort} onClick={toggleSort} SortIcon={SortIcon} />
            <Th label="Recommendation" />
            <ThSort label="Status" col="status" current={currentSort} onClick={toggleSort} SortIcon={SortIcon} />
            <ThSort label="Added" col="createdAt" current={currentSort} onClick={toggleSort} SortIcon={SortIcon} />
            {view === 'passed' && <Th label="" />}
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <CompanyRow key={company.id} company={company} view={view} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyRow({ company, view }: { company: CompanyWithFit; view: 'pipeline' | 'passed' }) {
  const router = useRouter();
  const [overriding, setOverriding] = useState(false);

  async function handleOverride(e: React.MouseEvent) {
    e.stopPropagation();
    setOverriding(true);
    try {
      await fetch(`/api/review/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Reviewing',
          reviewerNotes: '',
          nextStep: '',
          aiRecommendation: company.recommendation,
        }),
      });
      router.refresh();
    } finally {
      setOverriding(false);
    }
  }

  return (
    <tr
      className="border-b border-[#e8e2d4] hover:bg-[#f5f1e8] cursor-pointer transition-colors"
      onClick={() => router.push(`/opportunity/${company.id}`)}
    >
      <td className="py-5 pr-6">
        <Link
          href={`/opportunity/${company.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-serif text-[17px] font-medium text-[#0f1e3a] hover:text-[#6b1f2a] tracking-tight transition-colors"
        >
          {company.name}
        </Link>
      </td>
      <td className="py-5 pr-6 text-[13px] text-[#1a1816]">{company.sector}</td>
      <td className="py-5 pr-6 text-[13px] text-[#6b6358]">{company.workflowCategory}</td>
      <td className="py-5 pr-6 text-[13px] text-[#6b6358]">{company.stage}</td>
      <td className="py-5 pr-6"><FitBadge score={company.fitScore} showScore /></td>
      <td className="py-5 pr-6">
        {company.recommendation ? (
          <span className={cn('text-[13px]', REC_STYLES[company.recommendation] ?? 'text-[#6b6358]')}>
            {company.recommendation}
          </span>
        ) : (
          <span className="text-[12px] text-[#908874]">—</span>
        )}
      </td>
      <td className="py-5 pr-6"><StatusBadge status={company.status} /></td>
      <td className="py-5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
        {formatDateShort(company.createdAt)}
      </td>
      {view === 'passed' && (
        <td className="py-5 pl-2">
          <button
            onClick={handleOverride}
            disabled={overriding}
            className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium border border-[#1a1816] px-2.5 py-1 hover:bg-[#1a1816] hover:text-[#faf7f2] transition-colors rounded-sm disabled:opacity-50 inline-flex items-center gap-1"
          >
            {overriding ? 'Moving...' : <>Override <ArrowRight className="w-3 h-3" /></>}
          </button>
        </td>
      )}
    </tr>
  );
}

function Th({ label }: { label: string }) {
  return (
    <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] font-medium text-left pb-3 pr-6">
      {label}
    </th>
  );
}

function ThSort({
  label,
  col,
  current,
  onClick,
  SortIcon,
}: {
  label: string;
  col: SortKey;
  current: SortKey;
  onClick: (col: SortKey) => void;
  SortIcon: (props: { col: SortKey }) => React.ReactElement;
}) {
  return (
    <th
      className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] font-medium text-left pb-3 pr-6 cursor-pointer select-none hover:text-[#1a1816]"
      onClick={() => onClick(col)}
    >
      {label}
      <SortIcon col={col} />
    </th>
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}
