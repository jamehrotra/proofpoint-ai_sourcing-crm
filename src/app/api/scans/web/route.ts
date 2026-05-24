import { NextRequest } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { insertScan } from '../../../../../db/queries/scans';
import {
  insertCompany,
  getCompanyBySourceUrl,
  getCompanyByApproximateName,
} from '../../../../../db/queries/companies';
import { getProfileByCompanyId, insertProfile } from '../../../../../db/queries/aiProfiles';
import { upsertFit } from '../../../../../db/queries/thesisFit';
import { discoverWebCandidates, type WebCandidate } from '../../../../lib/connectors/web';
import { webChain } from '../../../../lib/web/chain';
import { gatherCompanyEvidence } from '../../../../lib/web/companyEvidence';
import { extractProfile } from '../../../../lib/ai/extract';
import { scoreThesisFit } from '../../../../lib/ai/score';
import { summarizeCompanyDescription } from '../../../../lib/ai/summarize';
import { getUsernameFromRequest as _maybeUser } from '../../../../lib/session';

// Silence unused-import lint while keeping the helper available for future use.
void _maybeUser;

const RequestSchema = z.object({
  thesis: z.string().min(10),
  sector: z.string().optional(),
  workflow: z.string().optional(),
  maxCompanies: z.number().int().min(1).max(20).default(10),
});

/**
 * Streaming web-scan endpoint.
 *
 * Returns a newline-delimited JSON stream (NDJSON). Each line is a JSON object
 * with a discriminated `type` field. The client reads chunks, splits on newline,
 * and parses each line.
 *
 * Event types emitted:
 *   - status         (free-form progress)
 *   - queries        (search queries generated)
 *   - search-batch   (one of N searches finished)
 *   - classify       (URL classification summary)
 *   - expand-listicle (a listicle was expanded into N companies)
 *   - candidate-start (about to score a candidate)
 *   - candidate-done  (candidate scored, with companyId for routing)
 *   - warning        (non-fatal error)
 *   - done           (final summary)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', detail: parsed.error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { thesis, sector, workflow, maxCompanies } = parsed.data;
  const scanId = nanoid();
  const now = new Date().toISOString();

  insertScan({
    id: scanId,
    corpusId: null,
    sector: sector || 'Any',
    workflowCategory: workflow || 'Any',
    thesisPrompt: thesis,
    mode: 'web',
    rawInput: null,
    createdAt: now,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      let surfacedCount = 0;
      let passedCount = 0;
      let processedCount = 0;
      const warnings: string[] = [];

      try {
        emit({ type: 'status', message: 'Generating search queries from thesis...' });

        // --- Discovery pipeline (yields candidates + progress events)
        const candidates: WebCandidate[] = [];
        for await (const event of discoverWebCandidates({
          thesis,
          sector,
          workflow,
          maxCompanies,
        })) {
          if (event.type === 'candidate') {
            candidates.push(event.candidate);
          } else if (event.type === 'warning') {
            warnings.push(event.message);
            emit(event);
          } else {
            emit(event);
          }
        }

        console.log(`[web-scan] Discovery yielded ${candidates.length} candidates for thesis: "${thesis.slice(0, 80)}..."`);
        if (candidates.length === 0) {
          emit({ type: 'warning', message: 'No candidate URLs found from any search.' });
          emit({
            type: 'done',
            scanId,
            surfacedCount: 0,
            passedCount: 0,
            processedCount: 0,
            warnings,
          });
          controller.close();
          return;
        }

        emit({ type: 'status', message: `Discovered ${candidates.length} candidates. Scoring...` });

        // --- Per-candidate: fetch + extract + score + persist
        for (let i = 0; i < candidates.length; i++) {
          const candidate = candidates[i];
          emit({
            type: 'candidate-start',
            index: i + 1,
            total: candidates.length,
            url: candidate.url,
            hint: candidate.hint ?? candidate.source,
          });

          try {
            let companyId: string = nanoid();
            let profileForScoring;
            let isExisting = false;

            // 1. Dedupe by sourceUrl — re-use existing company if same URL was scanned before.
            const existingCompany = getCompanyBySourceUrl(candidate.url);
            if (existingCompany) {
              const existingProfile = getProfileByCompanyId(existingCompany.id);
              if (existingProfile) {
                companyId = existingCompany.id;
                isExisting = true;
                profileForScoring = {
                  problem: existingProfile.problem,
                  customer: existingProfile.customer,
                  aiUseCase: existingProfile.aiUseCase,
                  dataMoatPotential: existingProfile.dataMoatPotential,
                  businessModel: existingProfile.businessModel,
                  fundingStage: existingProfile.fundingStage,
                  competitiveLandscape: existingProfile.competitiveLandscape,
                  risks: JSON.parse(existingProfile.risks as string),
                };
              } else {
                throw new Error('Existing company has no profile (orphaned row)');
              }
            }

            // Will hold all the prepared data for the new-company case.
            // descriptionPromise resolves AFTER score so the two run concurrently.
            let preparedInsert: {
              extracted: import('../../../../lib/types').AIProfileInput;
              descriptionPromise: Promise<string>;
            } | null = null;

            // Track which URLs we evaluated (used for the Sources card later)
            let evidenceUrls: string[] = [];

            if (!isExisting) {
              // 2. Fetch the primary URL.
              const fetched = await webChain.fetchUrl(candidate.url);
              if (!fetched.result) {
                throw new Error(`No provider could fetch ${candidate.url}`);
              }
              const homepageText = fetched.result.text;

              // 3. Hint the extractor about what kind of source this is.
              const sourceKind: 'company-site' | 'news-article' =
                candidate.source === 'article-url' ? 'news-article' : 'company-site';

              // First-pass extract on JUST the homepage to learn the company name.
              const firstPassInput = candidate.blurb
                ? `${candidate.blurb}\n\n${homepageText}`
                : homepageText;
              const extracted = await extractProfile(firstPassInput, sourceKind);

              // 3b. Name-based dedupe: if we already have a company by approximately
              //     this name, short-circuit and re-use the existing profile so a
              //     second scan source doesn't create a duplicate row.
              const matchByName = getCompanyByApproximateName(extracted.companyName);
              if (matchByName) {
                const existingProfile = getProfileByCompanyId(matchByName.id);
                if (existingProfile) {
                  companyId = matchByName.id;
                  isExisting = true;
                  profileForScoring = {
                    problem: existingProfile.problem,
                    customer: existingProfile.customer,
                    aiUseCase: existingProfile.aiUseCase,
                    dataMoatPotential: existingProfile.dataMoatPotential,
                    businessModel: existingProfile.businessModel,
                    fundingStage: existingProfile.fundingStage,
                    competitiveLandscape: existingProfile.competitiveLandscape,
                    risks: JSON.parse(existingProfile.risks as string),
                  };
                  evidenceUrls = [candidate.url];
                  console.log(
                    `[web-scan] Deduped by name: "${extracted.companyName}" -> existing company ${matchByName.id}`
                  );
                }
              }
              if (isExisting) {
                // jump past the heavy evidence gathering below
              } else {

              // 4. Multi-page evidence gathering (about / team / customers / funding news).
              //    Best-effort: failures here are silently skipped.
              let combinedEvidenceText = homepageText;
              try {
                const evidence = await gatherCompanyEvidence(
                  extracted.companyName,
                  candidate.url,
                  homepageText
                );
                combinedEvidenceText = evidence.combinedText;
                evidenceUrls = evidence.sourceUrls;
              } catch (err) {
                console.error(
                  `[web-scan] Evidence gathering failed for ${extracted.companyName}:`,
                  (err as Error).message
                );
                evidenceUrls = [candidate.url];
              }

              // 5. Clean description for the dossier (best-effort).
              //    We don't actually need this until the insert step below, so we'll
              //    fire it in parallel with scoring further down. For now, store the
              //    in-flight promise on preparedInsert.
              const descriptionPromise = summarizeCompanyDescription(
                extracted.companyName,
                combinedEvidenceText
              ).catch(() => (candidate.blurb ?? extracted.problem).slice(0, 300));

              preparedInsert = { extracted, descriptionPromise };
              profileForScoring = {
                problem: extracted.problem,
                customer: extracted.customer,
                aiUseCase: extracted.aiUseCase,
                dataMoatPotential: extracted.dataMoatPotential,
                businessModel: extracted.businessModel ?? '',
                fundingStage: extracted.fundingStage ?? extracted.stageEstimate ?? 'Unknown',
                competitiveLandscape: extracted.competitiveLandscape ?? '',
                risks: extracted.risks,
              };
              // companyId already initialized to a fresh nanoid above.
              } // close inner "else" from the name-dedupe short-circuit
            } else {
              // already set above
              if (!profileForScoring) throw new Error('Internal: missing profile for existing company');
            }

            // 5. Score thesis fit — must succeed before we commit any new rows.
            const fit = await scoreThesisFit(profileForScoring!, thesis);

            // 6. Commit (insert + profile + fit) atomically now that scoring succeeded.
            if (preparedInsert) {
              const { extracted, descriptionPromise } = preparedInsert;
              const cleanDescription = await descriptionPromise;
              insertCompany({
                id: companyId,
                name: extracted.companyName,
                sector: extracted.sector ?? sector ?? 'Unknown',
                workflowCategory: extracted.workflowCategory ?? workflow ?? 'Unknown',
                stage: extracted.stageEstimate ?? 'Unknown',
                geography: 'Unknown',
                website: candidate.url,
                description: cleanDescription,
                status: 'New',
                sourceType: 'ai-extracted',
                scanId,
                corpusCompanyId: null,
                sourceUrl: candidate.url,
                createdAt: new Date().toISOString(),
              });
              insertProfile({
                id: nanoid(),
                companyId,
                problem: extracted.problem,
                customer: extracted.customer,
                aiUseCase: extracted.aiUseCase,
                dataMoatPotential: extracted.dataMoatPotential,
                businessModel: extracted.businessModel ?? '',
                fundingStage: extracted.fundingStage ?? extracted.stageEstimate ?? 'Unknown',
                competitiveLandscape: extracted.competitiveLandscape ?? '',
                risks: JSON.stringify(extracted.risks),
                extractedAt: new Date().toISOString(),
              });
            }

            upsertFit({
              id: nanoid(),
              companyId,
              fitScore: fit.thesisFitScore,
              recommendation: fit.recommendation,
              rationale: fit.rationale,
              keyRisks: JSON.stringify(fit.keyRisks),
              diligenceQuestions: JSON.stringify(fit.diligenceQuestions),
              nextStep: fit.nextStep,
              thesisPromptUsed: thesis,
              scoredAt: new Date().toISOString(),
              dimensionsJson: JSON.stringify(fit.dimensions),
              sourceUrlsJson: JSON.stringify(evidenceUrls.length > 0 ? evidenceUrls : [candidate.url]),
            });

            if (fit.recommendation === 'Pass') passedCount++;
            else surfacedCount++;
            processedCount++;

            emit({
              type: 'candidate-done',
              index: i + 1,
              total: candidates.length,
              companyId,
              url: candidate.url,
              recommendation: fit.recommendation,
              fitScore: fit.thesisFitScore,
            });
          } catch (err) {
            const message = (err as Error).message;
            console.error(`[web-scan] Candidate ${i + 1}/${candidates.length} failed at ${candidate.url}: ${message}`);
            warnings.push(`Failed at ${candidate.url}: ${message}`);
            emit({
              type: 'candidate-done',
              index: i + 1,
              total: candidates.length,
              url: candidate.url,
              error: message,
            });
          }
        }

        emit({
          type: 'done',
          scanId,
          surfacedCount,
          passedCount,
          processedCount,
          warnings,
        });
        controller.close();
      } catch (err) {
        emit({ type: 'warning', message: `Fatal scan error: ${(err as Error).message}` });
        emit({
          type: 'done',
          scanId,
          surfacedCount,
          passedCount,
          processedCount,
          warnings,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
