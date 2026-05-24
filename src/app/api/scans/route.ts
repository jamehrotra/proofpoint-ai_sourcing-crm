import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { insertScan } from '../../../../db/queries/scans';
import {
  insertCompany,
  getCompanyByCorpusCompanyId,
  getCompanyBySourceUrl,
  updateCompanyStatus,
} from '../../../../db/queries/companies';
import { insertProfile, getProfileByCompanyId } from '../../../../db/queries/aiProfiles';
import { upsertFit } from '../../../../db/queries/thesisFit';
import { CorpusConnector } from '../../../lib/connectors/seed';
import { scoreThesisFit } from '../../../lib/ai/score';
import { extractProfile } from '../../../lib/ai/extract';
import { summarizeCompanyDescription } from '../../../lib/ai/summarize';
import { webChain, looksLikeUrl } from '../../../lib/web/chain';
import type { RawSourceResult } from '../../../lib/connectors/types';

const SearchScanSchema = z.object({
  mode: z.literal('search'),
  corpusId: z.string().min(1),
  sector: z.string().min(1),
  workflowCategory: z.string().min(1),
  thesisPrompt: z.string().min(10),
  maxCompanies: z.number().int().min(1).max(20).optional(),
});

const AnalyzeScanSchema = z.object({
  mode: z.literal('analyze'),
  sector: z.string().min(1).default('Any'),
  workflowCategory: z.string().min(1).default('Any'),
  thesisPrompt: z.string().min(10),
  rawInput: z.string().min(20),
});

const PDF_MAX_BYTES = 10 * 1024 * 1024;
const PDF_TEXT_MAX_CHARS = 30000;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.startsWith('multipart/form-data')) {
      return await handleMultipart(request);
    }

    return await handleJson(request);
  } catch (error) {
    const err = error as Error;
    console.error('POST /api/scans error:', err);
    return NextResponse.json({ error: 'Scan failed', detail: err.message }, { status: 500 });
  }
}

async function handleJson(request: NextRequest) {
  const body = await request.json();
  const mode = body.mode;

  if (mode === 'search') {
    const parsed = SearchScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan request', details: parsed.error.message }, { status: 400 });
    }
    return runSearchScan(parsed.data);
  }

  if (mode === 'analyze') {
    const parsed = AnalyzeScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan request', details: parsed.error.message }, { status: 400 });
    }
    return runAnalyzeScan({ ...parsed.data, rawInput: parsed.data.rawInput });
  }

  return NextResponse.json({ error: 'Unknown scan mode' }, { status: 400 });
}

async function handleMultipart(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  const thesisPrompt = (formData.get('thesisPrompt') as string | null)?.trim() ?? '';
  const sector = (formData.get('sector') as string | null) ?? 'Any';
  const workflowCategory = (formData.get('workflowCategory') as string | null) ?? 'Any';

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
  }

  if (file.size > PDF_MAX_BYTES) {
    return NextResponse.json({ error: 'PDF too large (max 10 MB)' }, { status: 400 });
  }

  if (thesisPrompt.length < 10) {
    return NextResponse.json({ error: 'Thesis prompt must be at least 10 characters' }, { status: 400 });
  }

  let extractedText = '';
  let parser: { destroy: () => Promise<void> } | null = null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { PDFParse } = await import('pdf-parse');
    const instance = new PDFParse({ data: buffer });
    parser = instance;
    const result = await instance.getText();
    extractedText = (result.text ?? '').trim();
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: 'Could not extract text from this PDF', detail: error.message },
      { status: 400 }
    );
  } finally {
    if (parser) {
      try { await parser.destroy(); } catch { /* noop */ }
    }
  }

  if (extractedText.length < 50) {
    return NextResponse.json(
      { error: 'PDF contained no usable text. Try a text-based PDF rather than scanned images.' },
      { status: 400 }
    );
  }

  if (extractedText.length > PDF_TEXT_MAX_CHARS) {
    extractedText = extractedText.slice(0, PDF_TEXT_MAX_CHARS);
  }

  return runAnalyzeScan({
    mode: 'analyze',
    sector,
    workflowCategory,
    thesisPrompt,
    rawInput: extractedText,
  });
}

async function runSearchScan(input: z.infer<typeof SearchScanSchema>) {
  const { corpusId, sector, workflowCategory, thesisPrompt, maxCompanies } = input;
  const scanId = nanoid();
  const now = new Date().toISOString();

  insertScan({
    id: scanId,
    corpusId,
    sector,
    workflowCategory,
    thesisPrompt,
    mode: 'search',
    rawInput: null,
    createdAt: now,
  });

  const connector = new CorpusConnector();
  let sources: RawSourceResult[] = [];
  try {
    sources = await connector.search({
      corpusId,
      sector,
      workflowCategory,
      thesisPrompt,
      maxCompanies: maxCompanies ?? 20,
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: 'Corpus query failed', detail: error.message }, { status: 500 });
  }

  if (sources.length === 0) {
    return NextResponse.json({
      scanId,
      surfacedCount: 0,
      passedCount: 0,
      processedCount: 0,
      warnings: ['No companies in the selected corpus matched your sector/workflow filters. Try widening the filters.'],
    });
  }

  const result = await evaluateAndStore(sources, thesisPrompt, scanId, now);
  return NextResponse.json({ scanId, ...result });
}

async function runAnalyzeScan(input: { mode: 'analyze'; sector: string; workflowCategory: string; thesisPrompt: string; rawInput: string }) {
  const { sector, workflowCategory, thesisPrompt, rawInput } = input;
  const scanId = nanoid();
  const now = new Date().toISOString();

  // If the user pasted a URL, fetch it via the web provider chain
  // (Tavily -> You.com -> Jina) and substitute the extracted page text.
  let textForExtraction = rawInput;
  let fetchedFrom: string | null = null;
  const fetchWarnings: string[] = [];
  const trimmed = rawInput.trim();
  if (looksLikeUrl(trimmed)) {
    const { result, attempts } = await webChain.fetchUrl(trimmed);
    if (!result) {
      const detail = attempts.map((a) => `${a.provider}: ${a.error}`).join(' | ');
      return NextResponse.json(
        { error: 'Could not fetch the URL with any provider', detail },
        { status: 502 }
      );
    }
    textForExtraction = result.text;
    fetchedFrom = `${result.provider} (${result.url})`;
    // Surface anything earlier in the chain that failed, for debugging
    for (const a of attempts) {
      fetchWarnings.push(`Web fetch fallback: ${a.provider} failed (${a.error})`);
    }
  }

  insertScan({
    id: scanId,
    corpusId: null,
    sector,
    workflowCategory,
    thesisPrompt,
    mode: 'analyze',
    rawInput: fetchedFrom ? `[URL: ${trimmed} via ${fetchedFrom}]\n\n${textForExtraction.slice(0, 2000)}` : rawInput,
    createdAt: now,
  });

  let extracted;
  try {
    extracted = await extractProfile(textForExtraction);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: 'Profile extraction failed', detail: error.message }, { status: 502 });
  }

  // AI-clean description for the dossier. Falls back to a raw text slice
  // if the summarizer call fails for any reason — never block the scan.
  let cleanDescription: string;
  try {
    cleanDescription = await summarizeCompanyDescription(extracted.companyName, textForExtraction);
  } catch (err) {
    console.error('summarizeCompanyDescription failed:', (err as Error).message);
    cleanDescription = stripMarkdownNoise(textForExtraction).slice(0, 400);
  }

  const source: RawSourceResult = {
    name: extracted.companyName,
    description: cleanDescription,
    sector: extracted.sector ?? sector,
    workflowCategory: extracted.workflowCategory ?? workflowCategory,
    stage: extracted.stageEstimate ?? 'Unknown',
    geography: 'Unknown',
    website: looksLikeUrl(trimmed) ? trimmed : null,
    sourceUrl: looksLikeUrl(trimmed) ? trimmed : undefined,
    prewrittenProfile: {
      problem: extracted.problem,
      customer: extracted.customer,
      aiUseCase: extracted.aiUseCase,
      dataMoatPotential: extracted.dataMoatPotential,
      businessModel: extracted.businessModel ?? '',
      fundingStage: extracted.fundingStage ?? extracted.stageEstimate ?? 'Unknown',
      competitiveLandscape: extracted.competitiveLandscape ?? '',
      risks: extracted.risks,
    },
  };

  const result = await evaluateAndStore([source], thesisPrompt, scanId, now);
  const mergedWarnings = [...fetchWarnings, ...result.warnings];
  return NextResponse.json({
    scanId,
    ...result,
    warnings: mergedWarnings,
    fetchedFrom,
  });
}

async function evaluateAndStore(
  sources: RawSourceResult[],
  thesisPrompt: string,
  scanId: string,
  now: string
) {
  const warnings: string[] = [];
  let surfacedCount = 0;
  let passedCount = 0;
  let processedCount = 0;

  for (const source of sources) {
    try {
      let companyId: string;
      let profileForScoring;

      if (source.corpusCompanyId) {
        const existing = getCompanyByCorpusCompanyId(source.corpusCompanyId);
        if (existing) {
          companyId = existing.id;
          profileForScoring = source.prewrittenProfile!;
        } else {
          companyId = nanoid();
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
            sourceType: 'corpus',
            scanId,
            corpusCompanyId: source.corpusCompanyId,
            sourceUrl: null,
            createdAt: now,
          });

          const profile = source.prewrittenProfile!;
          insertProfile({
            id: nanoid(),
            companyId,
            problem: profile.problem,
            customer: profile.customer,
            aiUseCase: profile.aiUseCase,
            dataMoatPotential: profile.dataMoatPotential,
            businessModel: profile.businessModel,
            fundingStage: profile.fundingStage,
            competitiveLandscape: profile.competitiveLandscape,
            risks: JSON.stringify(profile.risks),
            extractedAt: now,
          });
          profileForScoring = profile;
        }
      } else if (source.sourceUrl && getCompanyBySourceUrl(source.sourceUrl)) {
        // Dedupe: company with this sourceUrl already exists. Reuse it and
        // simply add a new thesis-fit (multi-fit feature). Profile is not
        // overwritten — Score History card shows the evolution.
        const existing = getCompanyBySourceUrl(source.sourceUrl)!;
        companyId = existing.id;
        const existingProfile = getProfileByCompanyId(companyId);
        if (existingProfile) {
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
          // Edge case: company exists but profile doesn't. Fall back to source profile.
          profileForScoring = source.prewrittenProfile!;
        }
      } else {
        companyId = nanoid();
        const profile = source.prewrittenProfile!;
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
          corpusCompanyId: null,
          sourceUrl: source.sourceUrl ?? null,
          createdAt: now,
        });
        insertProfile({
          id: nanoid(),
          companyId,
          problem: profile.problem,
          customer: profile.customer,
          aiUseCase: profile.aiUseCase,
          dataMoatPotential: profile.dataMoatPotential,
          businessModel: profile.businessModel,
          fundingStage: profile.fundingStage,
          competitiveLandscape: profile.competitiveLandscape,
          risks: JSON.stringify(profile.risks),
          extractedAt: now,
        });
        profileForScoring = profile;
      }

      const fitResult = await scoreThesisFit(profileForScoring, thesisPrompt);

      // For corpus + analyze modes, source URLs reduce to whatever we have on the
      // source row: corpus companies have a website, analyze-mode companies have
      // either a URL (if the user pasted one) or no external sources at all.
      const fitSourceUrls: string[] = [];
      if (source.sourceUrl) fitSourceUrls.push(source.sourceUrl);
      else if (source.website) fitSourceUrls.push(source.website);

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
        dimensionsJson: JSON.stringify(fitResult.dimensions),
        sourceUrlsJson: JSON.stringify(fitSourceUrls),
      });

      updateCompanyStatus(companyId, 'New');

      if (fitResult.recommendation === 'Pass') {
        passedCount++;
      } else {
        surfacedCount++;
      }
      processedCount++;
    } catch (err) {
      const error = err as Error;
      console.error(`Failed to process company ${source.name}:`, error.message);
      warnings.push(`Could not score ${source.name}: ${error.message}`);
    }
  }

  return { surfacedCount, passedCount, processedCount, warnings };
}

/**
 * Quick fallback cleaner for raw fetched page text when the AI summarizer fails.
 * Strips markdown image syntax, link URLs, and collapses whitespace.
 */
function stripMarkdownNoise(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // ![alt](url)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) -> text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
