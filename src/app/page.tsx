import Link from 'next/link';
import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueueTable } from '@/components/dashboard/QueueTable';
import { QueueFilters } from '@/components/dashboard/QueueFilters';
import { Button } from '@/components/ui/button';
import { getCompanies } from '../../db/queries/companies';

interface SearchParams {
  search?: string;
  sector?: string;
  status?: string;
  recommendation?: string;
  sort?: string;
  dir?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawCompanies = getCompanies(params);
  const companies = rawCompanies.map((c) => ({
    ...c,
    status: c.status as import('../lib/types').WorkflowStatus,
    sourceType: c.sourceType as import('../lib/types').SourceType,
    recommendation: c.recommendation as import('../lib/types').AIRecommendation | null,
    reviewStatus: c.reviewStatus as import('../lib/types').WorkflowStatus | null,
  }));

  const scoredCount = companies.filter((c) => c.fitScore !== null).length;

  return (
    <PageShell
      title="Sourcing Pipeline"
      description={`${companies.length} companies · ${scoredCount} scored`}
      action={
        <Link href="/scan">
          <Button size="sm">New Scan</Button>
        </Link>
      }
    >
      <Suspense>
        <QueueFilters />
        <QueueTable companies={companies} />
      </Suspense>
    </PageShell>
  );
}
