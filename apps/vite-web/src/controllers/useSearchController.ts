import { useState, useEffect } from 'react';
import type { InventoryItem } from '@/core/types/domain';
import { supabase } from '@/lib/supabase/browser';

export const useSearchController = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        // Asumiendo que tienes una función RPC (Postgres Function) en Supabase 
        // para búsqueda Full-Text o HNSW Vector Search (Búsqueda semántica)
        const { data, error } = await supabase.rpc('search_inventory', { 
          search_term: query 
        });

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error("Error en búsqueda:", error);
      } finally {
        setIsSearching(false);
      }
    };

    // DEBOUNCE: Esperamos 300ms después de que el usuario deja de escribir
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
    
  }, [query]);

  return { query, setQuery, results, isSearching };
};
