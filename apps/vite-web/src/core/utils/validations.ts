export class Validator {
  static isValidImage(dataUrl: string): boolean {
    if (!dataUrl) return false;
    
    // Verificar formato
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const hasValidFormat = validFormats.some(format => dataUrl.includes(format));
    
    if (!hasValidFormat) return false;
    
    // Verificar tamaño (máx 10MB)
    const base64 = dataUrl.split(',')[1];
    if (base64) {
      const sizeInMB = base64.length * 0.75 / 1024 / 1024;
      if (sizeInMB > 10) return false;
    }
    
    return true;
  }
  
  static isValidText(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  }
  
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .slice(0, 100);
  }
  
  static validatePrice(price: number): boolean {
    return !isNaN(price) && price >= 0 && price <= 100000;
  }
  
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Ocurrió un error inesperado';
  }
}

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;
  
  constructor(maxRequests: number = 10, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  
  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}
