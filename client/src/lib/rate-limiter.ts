/**
 * Client-side Rate Limiter
 * Prevents spam and abuse by limiting the number of actions per time window
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional storage key for persistence */
  storageKey?: string;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private records: Map<string, RequestRecord[]>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.records = new Map();

    // Load from localStorage if key provided
    if (config.storageKey && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Check if an action is allowed
   * @param key - Identifier for the action (e.g., user ID, IP, action type)
   * @returns true if allowed, false if rate limit exceeded
   */
  public check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create record
    let requests = this.records.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(req => req.timestamp > windowStart);

    // Count total requests
    const totalRequests = requests.reduce((sum, req) => sum + req.count, 0);

    // Check if limit exceeded
    if (totalRequests >= this.config.maxRequests) {
      return false;
    }

    // Add new request
    requests.push({ timestamp: now, count: 1 });
    this.records.set(key, requests);

    // Persist to storage if configured
    this.saveToStorage();

    return true;
  }

  /**
   * Get remaining requests for a key
   */
  public getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const requests = (this.records.get(key) || [])
      .filter(req => req.timestamp > windowStart);

    const used = requests.reduce((sum, req) => sum + req.count, 0);
    return Math.max(0, this.config.maxRequests - used);
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  public getResetTime(key: string): number {
    const requests = this.records.get(key);
    if (!requests || requests.length === 0) return 0;

    const oldestRequest = requests[0];
    const resetTime = oldestRequest.timestamp + this.config.windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Reset rate limit for a key
   */
  public reset(key: string): void {
    this.records.delete(key);
    this.saveToStorage();
  }

  /**
   * Reset all rate limits
   */
  public resetAll(): void {
    this.records.clear();
    this.saveToStorage();
  }

  /**
   * Load records from localStorage
   */
  private loadFromStorage(): void {
    if (!this.config.storageKey) return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      this.records = new Map(Object.entries(data));
    } catch (error) {
      console.error('[RateLimiter] Failed to load from storage:', error);
    }
  }

  /**
   * Save records to localStorage
   */
  private saveToStorage(): void {
    if (!this.config.storageKey) return;

    try {
      const data = Object.fromEntries(this.records);
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[RateLimiter] Failed to save to storage:', error);
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Email sending: 10 emails per minute
export const emailRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  storageKey: 'rate-limit:email',
});

// Login attempts: 5 attempts per 15 minutes
export const loginRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  storageKey: 'rate-limit:login',
});

// API calls: 100 requests per minute
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  storageKey: 'rate-limit:api',
});

// Form submissions: 3 submissions per minute
export const formRateLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 1000, // 1 minute
  storageKey: 'rate-limit:form',
});

/**
 * Higher-order function to wrap an async function with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter,
  key: string,
  onLimitExceeded?: (resetTime: number) => void
): T {
  return (async (...args: any[]) => {
    if (!limiter.check(key)) {
      const resetTime = limiter.getResetTime(key);

      if (onLimitExceeded) {
        onLimitExceeded(resetTime);
      } else {
        const seconds = Math.ceil(resetTime / 1000);
        throw new Error(
          `Rate limit exceeded. Please try again in ${seconds} second${seconds === 1 ? '' : 's'}.`
        );
      }

      return;
    }

    return await fn(...args);
  }) as T;
}
