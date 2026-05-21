import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { insertScan } from '../../../../db/queries/scans';
import { getCompanies, insertCompany, updateCompanyStatus } from '../../../../db/queries/companies';
import { getProfileByCompanyId, insertProfile } from '../../../../db/queries/aiProfiles';
import { upsertFit } from '../../../../db/queries/thesisFit';
import { SeedDataConnector } from '../../../lib/connectors/seed';
import { ManualInputConnector } from '../../../lib/connectors/manual';
import { scoreThesisFit } from '../../../lib/ai/score';
import { extractProfile } from '../../../lib/ai/extract';
import type { RawSourceResult } from '../../../lib/connectors/types';

const ScanRequestSchema = z.object({
  sector: z.string().min(1),
  workflowCategory: z.string().min(1),
  thesisPrompt: z.string().min(10),
  mode: z.enum(['search', 'analyze']),
  rawInput: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ScanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan request', details: parsed.error.message }, { status: 400 });
    }

    const { sector, workflowCategory, thesisPrompt, mode, rawInput } = parsed.data;

    if (mode === 'analyze' && !rawInput?.trim()) {
      return NextResponse.json({ error: 'rawInput is required for analyze mode' }, { status: 400 });
    }

    const scanId = nanoid();
    const now = new Date().toISOString();

    insertScan({ id: scanId, sector, workflowCategory, thesisPrompt, mode, rawInput: rawInput ?? null, createdAt: now });

    const query = { sector, workflowCategory, thesisPrompt, rawInput };

    let sourceResults: RawSourceResult[] = [];
    if (mode === 'search') {
      const connector = new SeedDataConnector();
      sourceResults = await connector.search(query);
    } else {
      const connector = new ManualInputConnector();
      sourceResults = await connector.search(query);
    }

    const warnings: string[] = [];
    const processedCompanyIds: string[] = [];

    for (const source of sourceResults) {
      try {
        let companyId = source.existingCompanyId ?? nanoid();
        let aiProfileData: { problem: string; customer: string; aiUseCase: string; dataMoatPotential: string; businessModel?: string; fundingStage?: string; competitiveLandscape?: string; risks: string[] };

        if (source.existingCompanyId) {
          const existingProfile = getProfileByCompanyId(source.existingCompanyId);
          if (existingProfile) {
            aiProfileData = {
              ...existingProfile,
              risks: JSON.parse(existingProfile.risks as string),
            };
          } else {
            const extracted = await extractProfile(source.description);
            aiProfileData = extracted;
            insertProfile({
              id: nanoid(),
              companyId,
              problem: extracted.problem,
              customer: extracted.customer,
              aiUseCase: extracted.aiUseCase,
              dataMoatPotential: extracted.dataMoatPotential,
              businessModel: extracted.businessModel ?? '',
              fundingStage: extracted.fundingStage ?? 'Unknown',
              competitiveLandscape: extracted.competitiveLandscape ?? '',
              risks: JSON.stringify(extracted.risks),
              extractedAt: now,
            });
          }
        } else {
          const extracted = await extractProfile(source.description);
          aiProfileData = extracted;

          insertCompany({
            id: companyId,
            name: source.name,
            sector: source.sector,
            workflowCategory: source.workflowCategory,
            stage: source.stage,
            geography: source.geography,
            website: source.website,
            description: source.description,
            status: 'New',
            sourceType: 'ai-extracted',
            scanId,
            createdAt: now,
          });

          insertProfile({
            id: nanoid(),
            companyId,
            problem: extracted.problem,
            customer: extracted.customer,
            aiUseCase: extracted.aiUseCase,
            dataMoatPotential: extracted.dataMoatPotential,
            businessModel: extracted.businessModel ?? '',
            fundingStage: extracted.fundingStage ?? 'Unknown',
            competitiveLandscape: extracted.competitiveLandscape ?? '',
            risks: JSON.stringify(extracted.risks),
            extractedAt: now,
          });
        }

        const fitResult = await scoreThesisFit(aiProfileData, thesisPrompt);

        upsertFit({
          id: nanoid(),
          companyId,
          fitScore: fitResult.thesisFitScore,
          recommendation: fitResult.recommendation,
          rationale: fitResult.rationale,
          keyRisks: JSON.stringify(fitResult.keyRisks),
          diligenceQuestions: JSON.stringify(fitResult.diligenceQuestions),
          nextStep: fitResult.nextStep,
          thesisPromptUsed: thesisPrompt,
          scoredAt: now,
        });

        updateCompanyStatus(companyId, 'New');
        processedCompanyIds.push(companyId);
      } catch (err) {
        const error = err as Error;
        console.error(`Failed to process company ${source.name}:`, error.message);
        warnings.push(`Could not score ${source.name}: ${error.message}`);
      }
    }

    const companies = getCompanies({});
    const surfaced = companies.filter((c) => processedCompanyIds.includes(c.id));

    return NextResponse.json({ scanId, companies: surfaced, warnings });
  } catch (error) {
    const err = error as Error;
    console.error('POST /api/scans error:', err);
    return NextResponse.json({ error: 'Scan failed', detail: err.message }, { status: 500 });
  }
}
