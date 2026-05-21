import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCompanyById } from '../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../db/queries/aiProfiles';
import { getFitByCompanyId } from '../../../../db/queries/thesisFit';
import { getReviewByCompanyId } from '../../../../db/queries/reviewDecisions';
import { PageShell } from '@/components/layout/PageShell';
import { CompanyHeader } from '@/components/opportunity/CompanyHeader';
import { AIProfileSection } from '@/components/opportunity/AIProfileSection';
import { ThesisFitSection } from '@/components/opportunity/ThesisFitSection';
import { ReviewPanel } from '@/components/opportunity/ReviewPanel';
import { MemoSection } from '@/components/opportunity/MemoSection';
import type { AIProfile, ThesisFitAnalysis, ReviewDecision, Company } from '@/lib/types';

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const companyRow = getCompanyById(id);
  if (!companyRow) notFound();

  const company: Company = { ...companyRow, status: companyRow.status as Company['status'], sourceType: companyRow.sourceType as Company['sourceType'] };

  const profileRow = getProfileByCompanyId(id);
  const fitRow = getFitByCompanyId(id);
  const reviewRow = getReviewByCompanyId(id);

  const aiProfile: AIProfile | null = profileRow
    ? { ...profileRow, risks: JSON.parse(profileRow.risks) }
    : null;

  const thesisFit: ThesisFitAnalysis | null = fitRow
    ? {
        ...fitRow,
        recommendation: fitRow.recommendation as ThesisFitAnalysis['recommendation'],
        keyRisks: JSON.parse(fitRow.keyRisks),
        diligenceQuestions: JSON.parse(fitRow.diligenceQuestions),
      }
    : null;

  const reviewDecision: ReviewDecision | null = reviewRow
    ? {
        ...reviewRow,
        status: reviewRow.status as ReviewDecision['status'],
        aiRecommendation: reviewRow.aiRecommendation as ReviewDecision['aiRecommendation'],
      }
    : null;

  return (
    <PageShell>
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />
          Back to Pipeline
        </Link>
      </div>

      <div className="space-y-4">
        <CompanyHeader company={company} />

        {aiProfile && <AIProfileSection profile={aiProfile} />}

        {!aiProfile && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No AI profile available.</p>
            <p className="text-xs text-gray-400 mt-1">Run a sourcing scan to generate a structured profile for this company.</p>
          </div>
        )}

        {thesisFit && <ThesisFitSection fit={thesisFit} />}

        {!thesisFit && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No thesis-fit analysis yet.</p>
            <p className="text-xs text-gray-400 mt-1">Run a sourcing scan with a thesis prompt to generate a fit score for this company.</p>
          </div>
        )}

        {thesisFit && aiProfile && <MemoSection companyId={id} />}

        <ReviewPanel
          companyId={id}
          initialReview={reviewDecision}
          aiRecommendation={thesisFit?.recommendation ?? null}
        />
      </div>
    </PageShell>
  );
}
