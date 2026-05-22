'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <nav className="border-b border-[#e8e2d4] bg-[#faf7f2]">
      <div className="mx-auto max-w-7xl px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-serif text-[17px] font-medium text-[#0f1e3a] tracking-tight">Proofpoint</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-2 py-[3px]">
              Signal Scout
            </span>
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <Link
              href="/"
              className={cn(
                'text-[13px] px-3 py-1.5 rounded-sm transition-colors',
                pathname === '/'
                  ? 'bg-[#f5f1e8] text-[#1a1816] font-medium'
                  : 'text-[#6b6358] hover:text-[#1a1816] hover:bg-[#f5f1e8]/60'
              )}
            >
              Pipeline
            </Link>
            <Link
              href="/scan"
              className={cn(
                'text-[13px] px-3 py-1.5 rounded-sm transition-colors',
                pathname === '/scan'
                  ? 'bg-[#f5f1e8] text-[#1a1816] font-medium'
                  : 'text-[#6b6358] hover:text-[#1a1816] hover:bg-[#f5f1e8]/60'
              )}
            >
              New Scan
            </Link>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          Proofpoint Capital · {monthLabel}
        </span>
      </div>
    </nav>
  );
}
