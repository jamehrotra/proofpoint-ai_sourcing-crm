/**
 * Shared interface for any web provider in the chain (Tavily, You.com, Jina, etc.)
 *
 * Today we use fetchUrl() in the Analyze scan flow when a user pastes a URL.
 * Tomorrow we'll add a "Search the Web" scan mode that uses search() to
 * surface candidate companies dynamically instead of from a static corpus.
 */
export interface WebFetchResult {
  text: string;
  title?: string;
  url: string;
  provider: string;
}

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
  provider: string;
}

export interface WebProvider {
  name: string;
  /** Returns true if this provider has the credentials it needs to operate. */
  isAvailable(): boolean;
  /** Fetch a single URL and return its main content as plain text. */
  fetchUrl(url: string): Promise<WebFetchResult>;
  /**
   * Optional: search the web for a query. Not every provider implements this
   * (Jina is fetch-only). Returns top results, capped at opts.limit.
   */
  search?(query: string, opts?: { limit?: number }): Promise<WebSearchResult[]>;
}

export class WebFetchError extends Error {
  constructor(public readonly provider: string, message: string) {
    super(`[${provider}] ${message}`);
    this.name = 'WebFetchError';
  }
}
