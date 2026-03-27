import { createClient } from '@supabase/supabase-js';

export interface SearchQuery {
  text?: string;
  image?: string;
  filters?: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: 'new' | 'used' | 'refurbished';
  };
  limit?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  imageUrl?: string;
  price?: number;
  source: string;
  relevanceScore: number;
  attributes: Record<string, any>;
  similarItems?: SearchResult[];
}

class RobustSearchService {
  private supabase;
  private readonly defaultLimit = 20;
  private readonly maxLimit = 50;
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async search(query: SearchQuery): Promise<{
    results: SearchResult[];
    suggestions: string[];
    total: number;
    alternativeQueries: string[];
  }> {
    const sanitizedQuery = this.sanitizeQuery(query);
    const cacheKey = this.getCacheKey(sanitizedQuery);
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return { results: cached.results, suggestions: [], total: cached.results.length, alternativeQueries: [] };
    }
    
    try {
      let results: SearchResult[] = [];
      if (sanitizedQuery.text?.trim()) results = await this.textSearchWithFallback(sanitizedQuery);
      if (sanitizedQuery.image && results.length === 0) results = await this.imageSearch(sanitizedQuery);
      
      let suggestions: string[] = [];
      let alternativeQueries: string[] = [];
      if (results.length === 0 && sanitizedQuery.text) {
        suggestions = await this.generateSuggestions(sanitizedQuery.text);
        alternativeQueries = await this.generateAlternativeQueries(sanitizedQuery.text);
      }
      
      const limit = Math.min(sanitizedQuery.limit || this.defaultLimit, this.maxLimit);
      results = results.slice(0, limit);
      this.searchCache.set(cacheKey, { results, timestamp: Date.now() });
      
      return { results, suggestions, total: results.length, alternativeQueries };
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      return { results: [], suggestions: ['Intenta con términos más generales', 'Usa la cámara'], total: 0, alternativeQueries: [] };
    }
  }

  private sanitizeQuery(query: SearchQuery): SearchQuery {
    return {
      text: query.text?.trim().slice(0, 100) || '',
      image: query.image,
      filters: query.filters ? {
        category: query.filters.category?.slice(0, 50),
        brand: query.filters.brand?.slice(0, 50),
        minPrice: query.filters.minPrice && query.filters.minPrice > 0 ? query.filters.minPrice : undefined,
        maxPrice: query.filters.maxPrice && query.filters.maxPrice < 100000 ? query.filters.maxPrice : undefined,
        condition: query.filters.condition
      } : undefined,
      limit: Math.min(query.limit || this.defaultLimit, this.maxLimit)
    };
  }

  private async textSearchWithFallback(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const vectorResults = await this.vectorSearch(query);
      if (vectorResults.length > 0) return vectorResults;
    } catch (error) {
      console.warn('Vector search falló:', error);
    }
    return this.traditionalSearch(query);
  }

  private async vectorSearch(query: SearchQuery): Promise<SearchResult[]> {
    const embedding = await this.generateEmbedding(query.text!);
    const { data, error } = await this.supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: query.limit || this.defaultLimit
    });
    if (error) throw error;
    return this.formatResults(data || []);
  }

  private async traditionalSearch(query: SearchQuery): Promise<SearchResult[]> {
    let dbQuery = this.supabase.from('products').select('*');
    if (query.text) {
      const term = `%${query.text}%`;
      dbQuery = dbQuery.or(`name.ilike.${term},description.ilike.${term},brand.ilike.${term}`);
    }
    if (query.filters?.category) dbQuery = dbQuery.eq('category', query.filters.category);
    if (query.filters?.brand) dbQuery = dbQuery.ilike('brand', `%${query.filters.brand}%`);
    
    const { data, error } = await dbQuery.limit(query.limit || this.defaultLimit);
    if (error) throw error;
    return this.formatResults(data || []);
  }

  private async imageSearch(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const { robustAI } = await import('./robustAIService');
      const recognized = await robustAI.analyzeImage(query.image!);
      return this.textSearchWithFallback({ text: recognized.name, filters: query.filters });
    } catch (error) {
      console.error('Error en búsqueda por imagen:', error);
      return [];
    }
  }

  private async generateSuggestions(text: string): Promise<string[]> {
    const synonymMap: Record<string, string[]> = {
      'audifonos': ['auriculares', 'headphones'],
      'celular': ['teléfono', 'smartphone'],
      'computadora': ['laptop', 'pc'],
    };
    const words = text.toLowerCase().split(' ');
    const suggestions = words.flatMap(w => synonymMap[w] || []);
    suggestions.push('electrónica', 'hogar');
    return [...new Set(suggestions)].slice(0, 5);
  }

  private async generateAlternativeQueries(text: string): Promise<string[]> {
    const stopWords = ['de', 'la', 'que', 'el', 'en', 'y', 'a', 'los'];
    const words = text.toLowerCase().split(' ').filter(w => !stopWords.includes(w) && w.length > 2);
    if (words.length === 0) return [];
    return [words.slice(1).join(' '), words.slice(0, -1).join(' '), words[0]].filter(a => a && a !== text);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 500) })
      });
      if (!response.ok) throw new Error('Embedding failed');
      const data = await response.json();
      return data.embedding;
    } catch (error) {
      return this.simpleEmbedding(text);
    }
  }

  private simpleEmbedding(text: string): number[] {
    const embedding = new Array(300).fill(0);
    const words = text.toLowerCase().split(' ');
    for (let i = 0; i < Math.min(words.length, 300); i++) {
        let hash = 0;
        for (let j = 0; j < words[i].length; j++) hash = ((hash << 5) - hash) + words[i].charCodeAt(j);
        embedding[i] = Math.abs(hash) / 2147483647;
    }
    return embedding;
  }

  private formatResults(data: any[]): SearchResult[] {
    return data.map(item => ({
      id: item.id,
      name: (item.name || '').slice(0, 100).replace(/[<>]/g, '').trim(),
      brand: (item.brand || '').slice(0, 50),
      category: item.category || 'Otros',
      description: (item.description || '').slice(0, 200),
      imageUrl: item.image_url,
      price: item.price ? Number(item.price) : undefined,
      source: item.source || 'local',
      relevanceScore: item.similarity || 0.5,
      attributes: item.attributes || {}
    }));
  }

  private getCacheKey(query: SearchQuery): string {
    return JSON.stringify({ t: query.text, f: query.filters, l: query.limit });
  }

  clearCache(): void { this.searchCache.clear(); }
}

export const robustSearch = new RobustSearchService();
