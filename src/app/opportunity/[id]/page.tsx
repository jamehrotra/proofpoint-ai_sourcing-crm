import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCompanyById } from '../../../../db/queries/companies';
import { getProfileByCompanyId } from '../../../../db/queries/aiProfiles';
import { getFitByCompanyId, getAllFitsByCompanyId } from '../../../../db/queries/thesisFit';
import { getReviewByCompanyId } from '../../../../db/queries/reviewDecisions';
import { getTasksForCompany } from '../../../../db/queries/tasks';
import { getMemoByCompanyId } from '../../../../db/queries/memos';
import { getNotesForCompany } from '../../../../db/queries/notesLog';
import { PageShell } from '@/components/layout/PageShell';
import { CompanyHeader } from '@/components/opportunity/CompanyHeader';
import { VerdictBar } from '@/components/opportunity/VerdictBar';
import { AIProfileSection } from '@/components/opportunity/AIProfileSection';
import { ThesisFitSection } from '@/components/opportunity/ThesisFitSection';
import { ThesisDimensionsCard } from '@/components/opportunity/ThesisDimensionsCard';
import { SourcesCard } from '@/components/opportunity/SourcesCard';
import { ScoreHistory } from '@/components/opportunity/ScoreHistory';
import { ReviewPanel } from '@/components/opportunity/ReviewPanel';
import { MemoSection } from '@/components/opportunity/MemoSection';
import { OpenTasks } from '@/components/opportunity/OpenTasks';
import { NotesLog } from '@/components/opportunity/NotesLog';
import type { AIProfile, ThesisFitAnalysis, ReviewDecision, Company } from '@/lib/types';

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const companyRow = getCompanyById(id);
  if (!companyRow) notFound();

  const company: Company = {
    ...companyRow,
    status: companyRow.status as Company['status'],
    sourceType: companyRow.sourceType as Company['sourceType'],
  };

  const profileRow = getProfileByCompanyId(id);
  const fitRow = getFitByCompanyId(id);
  const allFitRows = getAllFitsByCompanyId(id);
  const reviewRow = getReviewByCompanyId(id);
  const memoRow = getMemoByCompanyId(id);
  const tasks = getTasksForCompany(id);
  const notes = getNotesForCompany(id);

  const aiProfile: AIProfile | null = profileRow
    ? { ...profileRow, risks: JSON.parse(profileRow.risks) }
    : null;

  const thesisFit: ThesisFitAnalysis | null = fitRow
    ? {
        ...fitRow,
        recommendation: fitRow.recommendation as ThesisFitAnalysis['recommendation'],
        keyRisks: JSON.parse(fitRow.keyRisks),
        diligenceQuestions: JSON.parse(fitRow.diligenceQuestions),
        dimensions: fitRow.dimensionsJson ? JSON.parse(fitRow.dimensionsJson) : null,
        sourceUrls: fitRow.sourceUrlsJson ? JSON.parse(fitRow.sourceUrlsJson) : null,
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
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#1a1816] mb-8 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to Pipeline
      </Link>

      <CompanyHeader company={company} />

      <VerdictBar
        aiRecommendation={thesisFit?.recommendation ?? null}
        aiFitScore={thesisFit?.fitScore ?? null}
        humanStatus={company.status}
      />

      {aiProfile ? (
        <AIProfileSection profile={aiProfile} />
      ) : (
        <EmptySection
          title="No structured profile yet"
          description="Run a sourcing scan to generate a structured AI profile for this company."
        />
      )}

      {thesisFit ? (
        <>
          <ThesisFitSection fit={thesisFit} companyId={id} />
          {thesisFit.dimensions && <ThesisDimensionsCard dimensions={thesisFit.dimensions} />}
          {thesisFit.sourceUrls && thesisFit.sourceUrls.length > 0 && (
            <SourcesCard urls={thesisFit.sourceUrls} />
          )}
          <ScoreHistory
            fits={allFitRows.map((f) => ({
              ...f,
              recommendation: f.recommendation as ThesisFitAnalysis['recommendation'],
              keyRisks: JSON.parse(f.keyRisks),
              diligenceQuestions: JSON.parse(f.diligenceQuestions),
              dimensions: f.dimensionsJson ? JSON.parse(f.dimensionsJson) : null,
              sourceUrls: f.sourceUrlsJson ? JSON.parse(f.sourceUrlsJson) : null,
            }))}
          />
        </>
      ) : (
        <EmptySection
          title="No thesis-fit analysis yet"
          description="Run a sourcing scan with a thesis prompt to generate a fit score."
        />
      )}

      {thesisFit && aiProfile && (
        <MemoSection
          companyId={id}
          initialMemo={memoRow?.markdown ?? null}
          initialGeneratedAt={memoRow?.generatedAt ?? null}
          initialGeneratedBy={memoRow?.generatedBy ?? null}
        />
      )}

      <ReviewPanel
        companyId={id}
        initialReview={reviewDecision}
        aiRecommendation={thesisFit?.recommendation ?? null}
      />

      <NotesLog notes={notes} />

      <OpenTasks tasks={tasks} />
    </PageShell>
  );
}

function EmptySection({ title, description }: { title: string; description: string }) {
  return (
    <section className="border border-dashed border-[#d4cec0] bg-[#faf7f2] py-12 px-8 text-center mb-6">
      <p className="font-serif text-[20px] italic text-[#6b6358] mb-1">{title}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">{description}</p>
    </section>
  );
}
