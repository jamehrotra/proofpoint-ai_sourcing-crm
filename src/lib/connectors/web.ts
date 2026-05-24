import { webChain } from '../web/chain';
import { generateSearchQueries } from '../web/queryGenerator';
import { classifyUrl, type UrlKind } from '../web/urlClassifier';
import { extractCompaniesFromArticle } from '../web/listicleExtractor';

/**
 * Trusted publisher domains we treat preferentially (kept here for documentation
 * and future use — we currently rely on the query generator to bias toward
 * startup-specific searches rather than appending site: filters that Tavily
 * doesn't always honor well).
 */
export const TRUSTED_SOURCE_DOMAINS = [
  'ycombinator.com',
  'a16z.com',
  'sequoiacap.com',
  'crunchbase.com',
  'techcrunch.com',
  'theinformation.com',
  'forbes.com',
  'producthunt.com',
];

const MAX_LISTICLES_TO_EXPAND = 3;
const MAX_COMPANIES_FROM_LISTICLE = 10;
const TAVILY_RESULTS_PER_QUERY = 15;

export interface WebCandidate {
  name: string | null; // null until we resolve the company name from the page
  url: string;
  source: 'company-url' | 'article-url' | 'listicle-expansion';
  blurb?: string; // optional pre-extracted blurb from a listicle
  hint?: string; // e.g. "extracted from Forbes Top 10 Healthcare AI Startups"
}

export type WebScanEvent =
  | { type: 'queries'; queries: string[] }
  | { type: 'search-batch'; query: string; resultsCount: number }
  | { type: 'classify'; total: number; companies: number; listicles: number; articles: number }
  | { type: 'expand-listicle'; url: string; extracted: number }
  | { type: 'candidate'; candidate: WebCandidate }
  | { type: 'warning'; message: string }
  // 'discovery-done' is internal to the discovery phase; the route route emits a
  // separate 'done' event when the FULL scan (including scoring) is complete.
  // These must NEVER collide or the client closes the stream early.
  | { type: 'discovery-done'; candidateCount: number };

export interface WebSearchInput {
  thesis: string;
  sector?: string;
  workflow?: string;
  maxCompanies: number; // 5-20
}

/**
 * Orchestrates the 5-stage web discovery pipeline.
 * Yields events as it progresses so the API route can stream them to the client.
 *
 * Stages:
 *   1. queries     - thesis → 3-5 search queries (Claude)
 *   2. search      - run each query (Tavily, biased toward SOURCE_PRIORS)
 *   3. classify    - URL → COMPANY|LISTICLE|ARTICLE|NOISE (heuristic)
 *   4. expand      - read listicle articles, extract company names (Claude)
 *   5. emit        - yield each candidate so the consumer can extract+score
 */
export async function* discoverWebCandidates(
  input: WebSearchInput
): AsyncGenerator<WebScanEvent, void, unknown> {
  const { thesis, sector, workflow, maxCompanies } = input;

  // --- Stage 1: generate search queries
  let queries: string[];
  try {
    queries = await generateSearchQueries(thesis, sector, workflow);
  } catch (err) {
    yield { type: 'warning', message: `Query generator failed: ${(err as Error).message}` };
    queries = [thesis.slice(0, 100)]; // fallback: search the thesis text itself
  }
  yield { type: 'queries', queries };

  // --- Stage 2: run each query, deduplicating URLs across queries
  const seenUrls = new Set<string>();
  const candidateUrls: Array<{ url: string; kind: UrlKind; title?: string; snippet?: string }> = [];

  for (const q of queries) {
    // Run the search as-is. The query generator already biases toward startups
    // and specific verticals. We post-classify results to prefer trusted sources.
    let results;
    try {
      const { results: r } = await webChain.search(q, { limit: TAVILY_RESULTS_PER_QUERY });
      results = r;
    } catch (err) {
      yield { type: 'warning', message: `Search "${q}" failed: ${(err as Error).message}` };
      continue;
    }

    let batchAdded = 0;
    for (const r of results) {
      if (seenUrls.has(r.url)) continue;
      seenUrls.add(r.url);
      const kind = classifyUrl(r.url);
      if (kind === 'NOISE') continue;
      candidateUrls.push({ url: r.url, kind, title: r.title, snippet: r.snippet });
      batchAdded++;
    }
    yield { type: 'search-batch', query: q, resultsCount: batchAdded };
  }

  // --- Stage 3: classification summary
  const companyCount = candidateUrls.filter((c) => c.kind === 'COMPANY').length;
  const listicleCount = candidateUrls.filter((c) => c.kind === 'LISTICLE').length;
  const articleCount = candidateUrls.filter((c) => c.kind === 'ARTICLE').length;
  yield {
    type: 'classify',
    total: candidateUrls.length,
    companies: companyCount,
    listicles: listicleCount,
    articles: articleCount,
  };

  // --- Stage 4: expand listicles (cap: MAX_LISTICLES_TO_EXPAND)
  const expandedCompanyUrls: WebCandidate[] = [];
  const listicles = candidateUrls.filter((c) => c.kind === 'LISTICLE').slice(0, MAX_LISTICLES_TO_EXPAND);

  for (const listicle of listicles) {
    let articleText: string;
    try {
      const fetchOutcome = await webChain.fetchUrl(listicle.url);
      if (!fetchOutcome.result) {
        yield { type: 'warning', message: `Could not fetch listicle ${listicle.url}` };
        continue;
      }
      articleText = fetchOutcome.result.text;
    } catch (err) {
      yield { type: 'warning', message: `Listicle fetch error: ${(err as Error).message}` };
      continue;
    }

    let extracted;
    try {
      extracted = await extractCompaniesFromArticle(articleText);
    } catch (err) {
      yield { type: 'warning', message: `Listicle extraction error: ${(err as Error).message}` };
      continue;
    }

    yield { type: 'expand-listicle', url: listicle.url, extracted: extracted.length };

    // For each extracted company name, run a quick search to resolve the official URL
    for (const company of extracted.slice(0, MAX_COMPANIES_FROM_LISTICLE)) {
      try {
        const { results } = await webChain.search(`${company.name} official site`, { limit: 3 });
        const officialish = results.find((r) => classifyUrl(r.url) === 'COMPANY') ?? results[0];
        if (!officialish) continue;
        if (seenUrls.has(officialish.url)) continue;
        seenUrls.add(officialish.url);
        expandedCompanyUrls.push({
          name: company.name,
          url: officialish.url,
          source: 'listicle-expansion',
          blurb: company.blurb,
          hint: `extracted from ${listicle.title ?? listicle.url}`,
        });
      } catch {
        // Skip this company silently — listicle expansion is best-effort.
      }
    }
  }

  // --- Stage 5: emit candidates, capped at maxCompanies.
  // Interleave order: COMPANY URLs and ARTICLE URLs alternate (both are high signal),
  // then listicle-expansions fill remaining slots. ARTICLE URLs are NOT deprioritized —
  // a TechCrunch piece about "Acme raises $20M" is excellent discovery signal.
  const companyEntries = candidateUrls
    .filter((c) => c.kind === 'COMPANY')
    .map<WebCandidate>((c) => ({
      name: null,
      url: c.url,
      source: 'company-url' as const,
      blurb: c.snippet,
    }));
  const articleEntries = candidateUrls
    .filter((c) => c.kind === 'ARTICLE')
    .map<WebCandidate>((c) => ({
      name: null,
      url: c.url,
      source: 'article-url' as const,
      blurb: c.snippet,
    }));

  // Interleave companies and articles so neither category starves the other.
  const interleaved: WebCandidate[] = [];
  const maxLen = Math.max(companyEntries.length, articleEntries.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < companyEntries.length) interleaved.push(companyEntries[i]);
    if (i < articleEntries.length) interleaved.push(articleEntries[i]);
  }
  const allCandidates: WebCandidate[] = [...interleaved, ...expandedCompanyUrls];

  const capped = allCandidates.slice(0, maxCompanies);
  for (const candidate of capped) {
    yield { type: 'candidate', candidate };
  }

  yield { type: 'discovery-done', candidateCount: capped.length };
}
