import { WebFetchError, type WebProvider, type WebFetchResult } from './types';

/**
 * Jina Reader. No API key required. Prepends r.jina.ai/<url> and returns
 * a clean markdown-ish rendering of the page. Slower than Tavily but never
 * needs auth, so it's the "last resort" floor in the chain.
 */
export class JinaProvider implements WebProvider {
  name = 'jina';

  isAvailable(): boolean {
    return true; // no key needed
  }

  async fetchUrl(url: string): Promise<WebFetchResult> {
    const target = `https://r.jina.ai/${url}`;
    let res: Response;
    try {
      res = await fetch(target, {
        headers: {
          Accept: 'text/plain',
          // X-Return-Format hint: ask for markdown so structure is preserved.
          'X-Return-Format': 'markdown',
        },
      });
    } catch (err) {
      throw new WebFetchError(this.name, `network error: ${(err as Error).message}`);
    }

    if (!res.ok) {
      throw new WebFetchError(this.name, `HTTP ${res.status}`);
    }

    const text = (await res.text()).trim();
    if (text.length < 50) {
      throw new WebFetchError(this.name, 'empty response');
    }

    return { text, url, provider: this.name };
  }
}
