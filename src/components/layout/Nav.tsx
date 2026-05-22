'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();
  const [openTaskCount, setOpenTaskCount] = useState<number | null>(null);
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const open = (data.tasks ?? []).filter((t: { done: number }) => t.done === 0).length;
        setOpenTaskCount(open);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

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
            <NavLink href="/" active={pathname === '/'} label="Pipeline" />
            <NavLink href="/scan" active={pathname === '/scan'} label="New Scan" />
            <NavLink
              href="/todo"
              active={pathname === '/todo'}
              label="To Do"
              badge={openTaskCount}
            />
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          Proofpoint Capital · {monthLabel}
        </span>
      </div>
    </nav>
  );
}

function NavLink({ href, active, label, badge }: { href: string; active: boolean; label: string; badge?: number | null }) {
  return (
    <Link
      href={href}
      className={cn(
        'text-[13px] px-3 py-1.5 rounded-sm transition-colors inline-flex items-center gap-1.5',
        active
          ? 'bg-[#f5f1e8] text-[#1a1816] font-medium'
          : 'text-[#6b6358] hover:text-[#1a1816] hover:bg-[#f5f1e8]/60'
      )}
    >
      <span>{label}</span>
      {badge !== undefined && badge !== null && badge > 0 && (
        <span
          className={cn(
            'font-mono text-[9px] uppercase tracking-[0.08em] rounded-sm px-1 py-[1px] min-w-[16px] text-center',
            active ? 'bg-[#1a1816] text-[#faf7f2]' : 'bg-[#6b1f2a] text-[#faf7f2]'
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
