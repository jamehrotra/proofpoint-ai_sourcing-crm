import Link from 'next/link';
import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueueTable } from '@/components/dashboard/QueueTable';
import { QueueFilters } from '@/components/dashboard/QueueFilters';
import { PipelineTabs } from '@/components/dashboard/PipelineTabs';
import { getCompanies, getCompanyCounts } from '../../db/queries/companies';
import type { CompanyWithFit, WorkflowStatus, SourceType, AIRecommendation } from '@/lib/types';

interface SearchParams {
  view?: string;
  search?: string;
  sector?: string;
  status?: string;
  recommendation?: string;
  scanId?: string;
  sort?: string;
  dir?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view: 'pipeline' | 'passed' = params.view === 'passed' ? 'passed' : 'pipeline';

  const counts = getCompanyCounts();

  if (counts.total === 0) {
    return <EmptyStatePage />;
  }

  const rawCompanies = getCompanies({ ...params, view });
  const companies: CompanyWithFit[] = rawCompanies.map((c) => ({
    ...c,
    status: c.status as WorkflowStatus,
    sourceType: c.sourceType as SourceType,
    recommendation: c.recommendation as AIRecommendation | null,
    reviewStatus: c.reviewStatus as WorkflowStatus | null,
  }));

  const scoredCount = companies.filter((c) => c.fitScore !== null).length;
  const priorityCount = companies.filter((c) => c.recommendation === 'Priority').length;
  const reviewingCount = companies.filter((c) => c.status === 'Reviewing' || c.status === 'Follow-Up').length;

  return (
    <PageShell
      eyebrow="Sourcing · Vertical AI"
      title={<>Pipeline <em className="font-light italic text-[#6b1f2a]">queue</em></>}
      masthead={
        <div className="text-right font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b6358] leading-[1.7]">
          <div><span className="text-[#1a1816] font-semibold">{counts.total}</span> companies tracked</div>
          <div><span className="text-[#1a1816] font-semibold">{scoredCount}</span> scored against thesis</div>
          <div><span className="text-[#1a1816] font-semibold">{priorityCount}</span> priority · <span className="text-[#1a1816] font-semibold">{reviewingCount}</span> in review</div>
        </div>
      }
      action={
        <Link
          href="/scan"
          className="inline-flex items-center gap-1.5 bg-[#1a1816] text-[#faf7f2] px-5 py-2.5 text-[12px] font-medium tracking-[0.02em] hover:bg-[#0f1e3a] transition-colors"
        >
          + New Scan
        </Link>
      }
    >
      <Suspense>
        <PipelineTabs active={view} pipelineCount={counts.pipeline} passedCount={counts.passed} />
        <QueueFilters />
        <QueueTable companies={companies} view={view} />
      </Suspense>
    </PageShell>
  );
}

function EmptyStatePage() {
  return (
    <PageShell
      eyebrow="Sourcing · Vertical AI"
      title={<>Welcome to <em className="font-light italic text-[#6b1f2a]">Signal Scout</em></>}
    >
      <div className="border border-[#e8e2d4] bg-white py-20 px-12 text-center max-w-3xl mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mb-4">
          Empty Pipeline
        </div>
        <h2 className="font-serif text-[28px] leading-[1.1] tracking-[-0.02em] text-[#1a1816] mb-3">
          No companies <em className="italic font-light text-[#6b1f2a]">yet.</em>
        </h2>
        <p className="text-[14px] text-[#6b6358] max-w-md mx-auto leading-relaxed mb-8">
          Run your first sourcing scan. The agent will reason over a curated corpus of Vertical AI companies — or extract a profile from any source material you paste or upload.
        </p>
        <Link
          href="/scan"
          className="inline-flex items-center gap-1.5 bg-[#1a1816] text-[#faf7f2] px-6 py-3 text-[13px] font-medium tracking-[0.02em] hover:bg-[#0f1e3a] transition-colors"
        >
          Start Your First Scan →
        </Link>
        <div className="mt-12 pt-8 border-t border-[#e8e2d4] grid grid-cols-3 gap-8 text-left">
          <FeatureCallout
            label="Step 01"
            title="Pick a corpus"
            description="Choose a quarterly pull of surfaced Vertical AI companies."
          />
          <FeatureCallout
            label="Step 02"
            title="Set your thesis"
            description="Write the investment thesis the AI should evaluate against."
          />
          <FeatureCallout
            label="Step 03"
            title="Review the queue"
            description="High-fit names enter the Pipeline. Passed names stay reviewable in a separate tab."
          />
        </div>
      </div>
    </PageShell>
  );
}

function FeatureCallout({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mb-1">{label}</div>
      <div className="font-serif text-[17px] text-[#1a1816] tracking-tight mb-1">{title}</div>
      <p className="text-[12.5px] text-[#6b6358] leading-relaxed">{description}</p>
    </div>
  );
}
