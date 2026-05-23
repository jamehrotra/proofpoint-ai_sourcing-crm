import {
  WebFetchError,
  type WebProvider,
  type WebFetchResult,
  type WebSearchResult,
} from './types';

interface YouComSearchHit {
  url: string;
  title?: string;
  description?: string;
  snippets?: string[];
}

interface YouComSearchResponse {
  hits?: YouComSearchHit[];
}

/**
 * You.com Search API. Their /search endpoint returns hits with snippets;
 * we synthesize fetchUrl by querying for the exact URL and reading back
 * the snippets if Tavily can't extract it.
 *
 * Note: You.com does not expose a dedicated URL-extraction endpoint, so
 * fetchUrl here is best-effort. It exists as a middle fallback between
 * Tavily (real extraction) and Jina (always-works floor).
 */
export class YouComProvider implements WebProvider {
  name = 'youcom';

  private get apiKey(): string | undefined {
    return process.env.YOUCOM_API_KEY?.trim() || undefined;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchUrl(url: string): Promise<WebFetchResult> {
    if (!this.apiKey) throw new WebFetchError(this.name, 'YOUCOM_API_KEY not set');

    // Search for the URL itself; You.com often indexes content even when raw
    // fetch is blocked. Best snippet block becomes the "extracted" text.
    const results = await this.search(url, { limit: 3 });
    const exact = results.find((r) => r.url === url) ?? results[0];

    if (!exact || exact.snippet.length < 50) {
      throw new WebFetchError(this.name, 'no usable snippets');
    }

    return {
      text: exact.snippet,
      title: exact.title,
      url: exact.url,
      provider: this.name,
    };
  }

  async search(query: string, opts: { limit?: number } = {}): Promise<WebSearchResult[]> {
    if (!this.apiKey) throw new WebFetchError(this.name, 'YOUCOM_API_KEY not set');

    const params = new URLSearchParams({
      query,
      num_web_results: String(Math.min(opts.limit ?? 10, 20)),
    });

    let res: Response;
    try {
      res = await fetch(`https://api.ydc-index.io/search?${params.toString()}`, {
        headers: {
          'X-API-Key': this.apiKey,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new WebFetchError(this.name, `network error: ${(err as Error).message}`);
    }

    if (!res.ok) {
      throw new WebFetchError(this.name, `HTTP ${res.status}`);
    }

    const data = (await res.json()) as YouComSearchResponse;
    return (data.hits ?? []).map((hit) => ({
      url: hit.url,
      title: hit.title ?? hit.url,
      snippet: hit.snippets?.join('\n\n') ?? hit.description ?? '',
      provider: this.name,
    }));
  }
}
