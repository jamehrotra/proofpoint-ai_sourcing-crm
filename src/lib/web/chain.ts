import { JinaProvider } from './jina';
import { TavilyProvider } from './tavily';
import { YouComProvider } from './youcom';
import type { WebProvider, WebFetchResult, WebSearchResult } from './types';

const MAX_TEXT_CHARS = 30_000;

export class WebProviderChain {
  private providers: WebProvider[];

  constructor(providers?: WebProvider[]) {
    this.providers = providers ?? [new TavilyProvider(), new YouComProvider(), new JinaProvider()];
  }

  /**
   * Try each provider in order. Returns the first successful, non-empty result.
   * Collects per-provider errors so callers can debug a complete chain failure.
   */
  async fetchUrl(
    url: string
  ): Promise<{ result: WebFetchResult | null; attempts: Array<{ provider: string; error: string }> }> {
    const attempts: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        attempts.push({ provider: provider.name, error: 'unavailable (missing key)' });
        continue;
      }

      try {
        const raw = await provider.fetchUrl(url);
        const text = raw.text.length > MAX_TEXT_CHARS ? raw.text.slice(0, MAX_TEXT_CHARS) : raw.text;
        return { result: { ...raw, text }, attempts };
      } catch (err) {
        attempts.push({ provider: provider.name, error: (err as Error).message });
      }
    }

    return { result: null, attempts };
  }

  /**
   * Search the web. Returns the first provider's results, or an empty array
   * if all providers fail. Used by the (future) Search-the-Web scan mode.
   * Jina doesn't implement search, so only Tavily and You.com participate.
   */
  async search(
    query: string,
    opts: { limit?: number } = {}
  ): Promise<{ results: WebSearchResult[]; attempts: Array<{ provider: string; error: string }> }> {
    const attempts: Array<{ provider: string; error: string }> = [];

    for (const provider of this.providers) {
      if (!provider.search) continue;
      if (!provider.isAvailable()) {
        attempts.push({ provider: provider.name, error: 'unavailable (missing key)' });
        continue;
      }
      try {
        const results = await provider.search(query, opts);
        if (results.length > 0) return { results, attempts };
        attempts.push({ provider: provider.name, error: 'empty results' });
      } catch (err) {
        attempts.push({ provider: provider.name, error: (err as Error).message });
      }
    }

    return { results: [], attempts };
  }
}

export const webChain = new WebProviderChain();

const URL_RE = /^https?:\/\/\S+$/i;

export function looksLikeUrl(input: string): boolean {
  return URL_RE.test(input.trim());
}
