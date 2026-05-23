import {
  WebFetchError,
  type WebProvider,
  type WebFetchResult,
  type WebSearchResult,
} from './types';

interface TavilyExtractResponse {
  results?: Array<{
    url: string;
    raw_content?: string;
    title?: string;
  }>;
  failed_results?: Array<{ url: string; error: string }>;
}

interface TavilySearchResponse {
  results?: Array<{
    url: string;
    title?: string;
    content?: string;
  }>;
}

export class TavilyProvider implements WebProvider {
  name = 'tavily';

  private get apiKey(): string | undefined {
    return process.env.TAVILY_API_KEY?.trim() || undefined;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchUrl(url: string): Promise<WebFetchResult> {
    if (!this.apiKey) throw new WebFetchError(this.name, 'TAVILY_API_KEY not set');

    let res: Response;
    try {
      res = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ urls: [url] }),
      });
    } catch (err) {
      throw new WebFetchError(this.name, `network error: ${(err as Error).message}`);
    }

    if (!res.ok) {
      throw new WebFetchError(this.name, `HTTP ${res.status}`);
    }

    const data = (await res.json()) as TavilyExtractResponse;
    const first = data.results?.[0];
    if (!first?.raw_content || first.raw_content.trim().length < 50) {
      throw new WebFetchError(this.name, 'empty extraction');
    }

    return {
      text: first.raw_content.trim(),
      title: first.title,
      url: first.url,
      provider: this.name,
    };
  }

  async search(query: string, opts: { limit?: number } = {}): Promise<WebSearchResult[]> {
    if (!this.apiKey) throw new WebFetchError(this.name, 'TAVILY_API_KEY not set');

    let res: Response;
    try {
      res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          max_results: Math.min(opts.limit ?? 10, 20),
          search_depth: 'advanced',
        }),
      });
    } catch (err) {
      throw new WebFetchError(this.name, `network error: ${(err as Error).message}`);
    }

    if (!res.ok) {
      throw new WebFetchError(this.name, `HTTP ${res.status}`);
    }

    const data = (await res.json()) as TavilySearchResponse;
    return (data.results ?? []).map((r) => ({
      url: r.url,
      title: r.title ?? r.url,
      snippet: r.content ?? '',
      provider: this.name,
    }));
  }
}
