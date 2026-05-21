'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-gray-900">Proofpoint</span>
            <span className="text-xs font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Signal Scout</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                'text-sm px-3 py-1.5 rounded-md transition-colors',
                pathname === '/'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              Pipeline
            </Link>
            <Link
              href="/scan"
              className={cn(
                'text-sm px-3 py-1.5 rounded-md transition-colors',
                pathname === '/scan'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              New Scan
            </Link>
          </div>
        </div>
        <span className="text-xs text-gray-400">Proofpoint Capital</span>
      </div>
    </nav>
  );
}
