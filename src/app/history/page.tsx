import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { getScansWithCounts } from '../../../db/queries/scans';
import { getCorpusById } from '../../../db/corpora';
import { displayNameForUsername as _unused } from '@/lib/auth';

// silence unused-import lint while keeping the helper available for future use
void _unused;

export default async function HistoryPage() {
  const scans = getScansWithCounts();

  return (
    <PageShell
      eyebrow="Sourcing · History"
      title={<>Past <em className="font-light italic text-[#6b1f2a]">scans</em></>}
      masthead={
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6358] leading-[1.7]">
          <div><span className="text-[#1a1816] font-semibold">{scans.length}</span> total scans</div>
          <div>
            <span className="text-[#1a1816] font-semibold">
              {scans.reduce((sum, s) => sum + s.totalCount, 0)}
            </span>{' '}
            companies evaluated all-time
          </div>
        </div>
      }
    >
      {scans.length === 0 ? (
        <div className="border-t border-b border-[#e8e2d4] py-20 text-center bg-[#faf7f2]">
          <p className="font-serif text-[20px] italic text-[#6b6358] mb-1">No scans yet.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">
            Run your first scan from the New Scan page.
          </p>
        </div>
      ) : (
        <div className="border-t border-[#e8e2d4]">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#1a1816]">
                <Th label="Date" />
                <Th label="Mode" />
                <Th label="Corpus" />
                <Th label="Sector / Workflow" />
                <Th label="Thesis Prompt" />
                <Th label="Surfaced" />
                <Th label="Passed" />
                <Th label="" />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
                const corpus = scan.corpusId ? getCorpusById(scan.corpusId) : null;
                return (
                  <tr
                    key={scan.id}
                    className="border-b border-[#e8e2d4] hover:bg-[#f5f1e8] transition-colors"
                  >
                    <td className="py-5 pr-6 font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6358] align-top">
                      {formatDate(scan.createdAt)}
                    </td>
                    <td className="py-5 pr-6 align-top">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium border border-[#e8e2d4] bg-[#f5f1e8] text-[#1a1816] rounded-sm px-2 py-[3px]">
                        {scan.mode === 'search' ? 'Search Corpus' : 'Analyze Data'}
                      </span>
                    </td>
                    <td className="py-5 pr-6 text-[13px] text-[#1a1816] align-top">
                      {corpus?.label ?? scan.corpusId ?? '—'}
                    </td>
                    <td className="py-5 pr-6 text-[13px] text-[#6b6358] align-top">
                      {scan.sector}
                      {scan.workflowCategory && scan.workflowCategory !== 'Any'
                        ? ` · ${scan.workflowCategory}`
                        : ''}
                    </td>
                    <td className="py-5 pr-6 align-top max-w-md">
                      <p className="font-serif text-[14px] italic text-[#1a1816] leading-[1.5] line-clamp-2">
                        &ldquo;{scan.thesisPrompt}&rdquo;
                      </p>
                    </td>
                    <td className="py-5 pr-6 font-mono text-[12px] text-[#1e5631] font-semibold align-top">
                      {scan.surfacedCount}
                    </td>
                    <td className="py-5 pr-6 font-mono text-[12px] text-[#6b6358] align-top">
                      {scan.passedCount}
                    </td>
                    <td className="py-5 align-top">
                      <Link
                        href={`/?scanId=${scan.id}`}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium border border-[#1a1816] px-2.5 py-1 hover:bg-[#1a1816] hover:text-[#faf7f2] transition-colors rounded-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

function Th({ label }: { label: string }) {
  return (
    <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] font-medium text-left pb-3 pr-6">
      {label}
    </th>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).toUpperCase();
}
