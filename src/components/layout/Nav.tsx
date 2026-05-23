'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NavProps {
  currentUserDisplayName: string;
  currentUsername: string;
}

export function Nav({ currentUserDisplayName, currentUsername }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openTaskCount, setOpenTaskCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = currentUserDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

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
            <NavLink href="/todo" active={pathname === '/todo'} label="To Do" badge={openTaskCount} />
            <NavLink href="/history" active={pathname === '/history'} label="History" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0f1e3a] text-[#faf7f2] flex items-center justify-center font-mono text-[10px] font-semibold tracking-wide">
              {initials || '·'}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-[13px] text-[#1a1816] tracking-tight">{currentUserDisplayName}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#6b6358]">@{currentUsername}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#6b1f2a] transition-colors disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
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
