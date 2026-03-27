import { useState, useCallback } from 'react';
import { semanticSearch } from '@/core/services/semanticSearch';
import type { SearchResult, SearchQuery } from '@/core/services/semanticSearch';

interface UseSmartSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: SearchQuery) => Promise<void>;
  clearResults: () => void;
  selectResult: (result: SearchResult) => void;
  selectedItem: SearchResult | null;
}

export function useSmartSearch(): UseSmartSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  
  const search = useCallback(async (query: SearchQuery) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await semanticSearch.search(query);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);
  
  const selectResult = useCallback((result: SearchResult) => {
    setSelectedItem(result);
  }, []);
  
  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
    selectResult,
    selectedItem,
  };
}
