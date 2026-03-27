interface CacheItem {
  value: any;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: any, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export const cache = new CacheService();
