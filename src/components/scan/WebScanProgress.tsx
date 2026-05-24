'use client';

import { Check, X, Search, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebScanProgressProps {
  queries: string[];
  classification: { total: number; companies: number; listicles: number; articles: number } | null;
  expansions: Array<{ url: string; extracted: number }>;
  candidates: Array<{
    index: number;
    total: number;
    url: string;
    hint?: string;
    status: 'scoring' | 'done' | 'error';
    recommendation?: 'Priority' | 'Watch' | 'Pass';
    fitScore?: number;
    error?: string;
  }>;
  warnings: string[];
  status: string;
  finished: boolean;
}

const REC_STYLES: Record<string, string> = {
  Priority: 'text-[#1e5631] border-[#1e5631] bg-[#1e5631]/[0.08]',
  Watch: 'text-[#b8893a] border-[#b8893a] bg-[#b8893a]/[0.08]',
  Pass: 'text-[#6b1f2a] border-[#6b1f2a] bg-[#6b1f2a]/[0.06]',
};

export function WebScanProgress({
  queries,
  classification,
  expansions,
  candidates,
  warnings,
  status,
  finished,
}: WebScanProgressProps) {
  return (
    <div className="border border-[#e8e2d4] bg-[#faf7f2] p-8">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
          AI · Live Scan
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">
          Searching the web {finished ? '— done' : <span className="italic text-[#6b1f2a]">in progress</span>}
        </h2>
      </div>

      {!finished && (
        <div className="flex items-center gap-3 mb-6 text-[14px] text-[#1a1816]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.4s]" />
          </div>
          <span className="font-serif italic text-[16px] text-[#1a1816]">{status}</span>
        </div>
      )}

      {queries.length > 0 && (
        <Section icon={<Search className="w-3.5 h-3.5" />} label="Search Queries Generated">
          <ul className="space-y-1.5">
            {queries.map((q, i) => (
              <li key={i} className="font-mono text-[11px] text-[#1a1816] flex items-baseline gap-2">
                <span className="text-[#6b1f2a]">{String(i + 1).padStart(2, '0')}</span>
                <span>&ldquo;{q}&rdquo;</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {classification && (
        <Section icon={<Sparkles className="w-3.5 h-3.5" />} label="URLs Classified">
          <div className="font-mono text-[11px] text-[#1a1816] flex flex-wrap gap-3">
            <span><strong>{classification.total}</strong> total</span>
            <span className="text-[#1e5631]"><strong>{classification.companies}</strong> company URLs</span>
            <span className="text-[#b8893a]"><strong>{classification.listicles}</strong> listicles</span>
            <span className="text-[#0f1e3a]"><strong>{classification.articles}</strong> articles</span>
          </div>
        </Section>
      )}

      {expansions.length > 0 && (
        <Section icon={<FileText className="w-3.5 h-3.5" />} label="Listicle Expansions">
          <ul className="space-y-1.5">
            {expansions.map((e, i) => (
              <li key={i} className="font-mono text-[11px] text-[#1a1816]">
                <span className="text-[#6b1f2a]">▸</span>{' '}
                <span className="text-[#6b6358]">{shortenUrl(e.url)}</span>{' '}
                → <strong>{e.extracted}</strong> companies extracted
              </li>
            ))}
          </ul>
        </Section>
      )}

      {candidates.length > 0 && (
        <Section icon={<Sparkles className="w-3.5 h-3.5" />} label={`Candidate Scoring (${candidates.filter((c) => c.status !== 'scoring').length} / ${candidates[0].total})`}>
          <ol className="space-y-2">
            {candidates.map((c) => (
              <li key={c.index} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3">
                <span className="font-mono text-[10px] text-[#6b1f2a]">
                  {String(c.index).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-[#1a1816] truncate">{shortenUrl(c.url)}</p>
                  {c.hint && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] mt-0.5">
                      {c.hint}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {c.status === 'scoring' && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6b1f2a] animate-pulse" />
                      Scoring...
                    </span>
                  )}
                  {c.status === 'done' && c.recommendation && (
                    <span className={cn(
                      'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] font-semibold border rounded-sm px-2 py-[3px]',
                      REC_STYLES[c.recommendation]
                    )}>
                      <Check className="w-3 h-3" />
                      {c.recommendation} · {c.fitScore}
                    </span>
                  )}
                  {c.status === 'error' && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a] inline-flex items-center gap-1.5">
                      <X className="w-3 h-3" />
                      {c.error?.slice(0, 40) ?? 'error'}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {warnings.length > 0 && (
        <Section icon={<X className="w-3.5 h-3.5" />} label="Warnings">
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="font-mono text-[10px] text-[#6b6358] leading-relaxed">
                · {w}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a]">
        {icon}
        {label}
      </div>
      <div className="pl-5 border-l border-[#e8e2d4]">{children}</div>
    </div>
  );
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname.length > 30 ? u.pathname.slice(0, 30) + '...' : u.pathname}`;
  } catch {
    return url;
  }
}
