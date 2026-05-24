export type UrlKind = 'COMPANY' | 'LISTICLE' | 'ARTICLE' | 'NOISE';

/**
 * Publisher domains: pages from these are NOT company sites.
 * Their content is either a single-company news piece (ARTICLE),
 * a roundup/listicle, or general coverage.
 */
const PUBLISHER_DOMAINS = new Set([
  'techcrunch.com',
  'forbes.com',
  'fortune.com',
  'businessinsider.com',
  'bloomberg.com',
  'theinformation.com',
  'reuters.com',
  'cnbc.com',
  'wsj.com',
  'venturebeat.com',
  'axios.com',
  'theverge.com',
  'fastcompany.com',
  'fiercehealthcare.com',
  'beckershospitalreview.com',
  'crunchbase.com',
  'producthunt.com',
  'ycombinator.com',
  'a16z.com',
  'sequoiacap.com',
  'firstround.com',
  'bvp.com',
  'medium.com',
  'substack.com',
  'wikipedia.org',
  'github.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
]);

/**
 * URL slug patterns that strongly indicate a roundup/listicle article.
 * If matched on a publisher domain, classify as LISTICLE so we expand it.
 */
const LISTICLE_PATTERNS = [
  /top-\d+/i,
  /best-\d+/i,
  /\d+-(startups|companies|ai-companies|to-watch|to-know)/i,
  /watchlist/i,
  /roundup/i,
  /\bmarket-map\b/i,
];

export function classifyUrl(url: string): UrlKind {
  let host = '';
  let pathname = '';
  try {
    const u = new URL(url);
    host = u.hostname.toLowerCase().replace(/^www\./, '');
    pathname = u.pathname.toLowerCase();
  } catch {
    return 'NOISE';
  }

  // True noise — these almost never yield useful per-company info.
  if (host === 'github.com' || host === 'linkedin.com') return 'NOISE';
  if (host === 'twitter.com' || host === 'x.com') return 'NOISE';
  if (host === 'reddit.com' || host === 'youtube.com') return 'NOISE';

  // Wikipedia pages about a SINGLE company can be useful; the general AI/healthcare
  // overview pages are noise. Heuristic: if the path has 2+ path segments, treat as ARTICLE.
  if (host === 'wikipedia.org' || host.endsWith('.wikipedia.org')) {
    const segments = pathname.split('/').filter(Boolean);
    return segments.length >= 2 ? 'ARTICLE' : 'NOISE';
  }

  // YC company pages: ycombinator.com/companies/<slug> is essentially a company profile.
  if (host === 'ycombinator.com') {
    if (pathname.startsWith('/companies/')) return 'COMPANY';
    return 'NOISE'; // YC home/about/careers
  }

  // Crunchbase organization pages are company profiles.
  if (host === 'crunchbase.com' && pathname.startsWith('/organization/')) {
    return 'COMPANY';
  }

  // Product Hunt product pages are essentially company landing pages.
  if (host === 'producthunt.com' && pathname.startsWith('/posts/')) {
    return 'COMPANY';
  }

  const isPublisher = PUBLISHER_DOMAINS.has(host);
  if (isPublisher) {
    // Listicle?
    if (LISTICLE_PATTERNS.some((re) => re.test(pathname))) {
      return 'LISTICLE';
    }
    if (host === 'a16z.com' && pathname.includes('/portfolio')) return 'COMPANY';
    // Otherwise treat as a single-company news ARTICLE — these are excellent
    // discovery signal (e.g. "Sardine raises $50M Series B").
    return 'ARTICLE';
  }

  // Looks like a company's own site (no publisher match).
  return 'COMPANY';
}
