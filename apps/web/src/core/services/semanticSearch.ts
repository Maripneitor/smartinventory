import { robustSearch } from './robustSearchService';
import type { SearchQuery, SearchResult } from './robustSearchService';

export type { SearchQuery, SearchResult };

class SemanticSearchWrapper {
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const response = await robustSearch.search(query);
    return response.results;
  }
}

export const semanticSearch = new SemanticSearchWrapper();
