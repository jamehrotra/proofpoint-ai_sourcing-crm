/**
 * WebSearchConnector — stubbed for prototype.
 *
 * In production, set WEB_SEARCH_PROVIDER=tavily or WEB_SEARCH_PROVIDER=exa
 * and implement the corresponding search API call here.
 * The interface is identical regardless of provider — swap the implementation,
 * not the contract.
 */
import type { SourceConnector, SourcingQuery, RawSourceResult } from './types';

const MOCK_RESULTS: RawSourceResult[] = [
  {
    name: 'MockWeb Co',
    description: 'A sample company returned by the mock web search connector. Configure WEB_SEARCH_PROVIDER=tavily or WEB_SEARCH_PROVIDER=exa to enable live web sourcing.',
    sector: 'Healthcare',
    workflowCategory: 'Clinical Ops',
    stage: 'Seed',
    geography: 'United States',
    website: null,
  },
];

export class WebSearchConnector implements SourceConnector {
  name = 'WebSearchConnector';

  async search(_query: SourcingQuery): Promise<RawSourceResult[]> {
    const provider = process.env.WEB_SEARCH_PROVIDER ?? 'mock';

    if (provider === 'tavily') {
      throw new Error('Tavily integration not yet implemented. Set WEB_SEARCH_PROVIDER=mock.');
    }

    if (provider === 'exa') {
      throw new Error('Exa integration not yet implemented. Set WEB_SEARCH_PROVIDER=mock.');
    }

    return MOCK_RESULTS;
  }
}
