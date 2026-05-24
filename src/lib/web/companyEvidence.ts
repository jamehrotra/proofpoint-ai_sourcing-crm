import { webChain } from './chain';

const SUBPATHS_TO_TRY = [
  '/about',
  '/about-us',
  '/team',
  '/company',
  '/customers',
  '/case-studies',
  '/our-story',
];

export interface CompanyEvidence {
  /** All page-text snippets we successfully gathered, concatenated with headers. */
  combinedText: string;
  /** List of URLs we actually fetched (for the Sources card in the UI). */
  sourceUrls: string[];
}

/**
 * Gather multi-page evidence about a company:
 *  1. The homepage (already fetched by the caller, passed in as homepageText).
 *  2. A handful of "about" / "customers" subpaths on the same origin.
 *  3. A Tavily search for "<company> funding" and fetch of the top news article.
 *
 * Steps 2 and 3 run CONCURRENTLY for speed (~5s instead of ~10s sequential).
 *
 * Best-effort: any individual fetch failure is silently skipped. The homepage
 * is always included.
 */
export async function gatherCompanyEvidence(
  companyName: string,
  homepageUrl: string,
  homepageText: string
): Promise<CompanyEvidence> {
  let origin = '';
  try {
    const u = new URL(homepageUrl);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    // bad URL — only origin-based subpath probing will be skipped
  }

  // Fire all sub-page fetches concurrently. We try all 7 paths in parallel
  // and keep the first 2 that succeed.
  const subpathFetches = origin
    ? SUBPATHS_TO_TRY.map((path) => ({ path, url: `${origin}${path}` }))
    : [];

  const subpageResultsPromise = Promise.all(
    subpathFetches.map(async ({ path, url }) => {
      try {
        const { result } = await webChain.fetchUrl(url);
        if (result && result.text.length > 200) {
          return { path, url, text: result.text };
        }
      } catch {
        // skip
      }
      return null;
    })
  );

  // Funding-news search runs in parallel with subpath fetches.
  const fundingArticlePromise = (async () => {
    try {
      const { results } = await webChain.search(`"${companyName}" funding round`, { limit: 3 });
      const fundingArticle = results.find((r) => {
        try {
          const u = new URL(r.url);
          return !u.hostname.includes(new URL(homepageUrl).hostname.replace(/^www\./, ''));
        } catch {
          return false;
        }
      });

      if (!fundingArticle) return null;
      const { result } = await webChain.fetchUrl(fundingArticle.url);
      if (result && result.text.length > 200) {
        return { url: fundingArticle.url, text: result.text };
      }
    } catch {
      // skip — funding article fetch is best-effort
    }
    return null;
  })();

  const [subpageResults, fundingResult] = await Promise.all([
    subpageResultsPromise,
    fundingArticlePromise,
  ]);

  // Assemble: homepage first, up to 2 successful subpages, then the funding article.
  const sections: string[] = [
    `=== HOMEPAGE: ${homepageUrl} ===\n${homepageText.slice(0, 8000)}`,
  ];
  const sourceUrls: string[] = [homepageUrl];

  let kept = 0;
  for (const r of subpageResults) {
    if (kept >= 2) break;
    if (!r) continue;
    sections.push(`=== ${r.path.toUpperCase()}: ${r.url} ===\n${r.text.slice(0, 4000)}`);
    sourceUrls.push(r.url);
    kept++;
  }

  if (fundingResult) {
    sections.push(`=== FUNDING NEWS: ${fundingResult.url} ===\n${fundingResult.text.slice(0, 4000)}`);
    sourceUrls.push(fundingResult.url);
  }

  return {
    combinedText: sections.join('\n\n'),
    sourceUrls,
  };
}
