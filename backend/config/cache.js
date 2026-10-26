import logger from './logger.js';

class CacheEngine {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, ttlSeconds = 300) {
    this.store.set(key, JSON.stringify(value));
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.ttls.set(key, expiresAt);
  }

  get(key) {
    if (!this.store.has(key)) {
      this.misses++;
      return null;
    }

    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.del(key);
      this.misses++;
      return null;
    }

    this.hits++;
    try {
      return JSON.parse(this.store.get(key));
    } catch {
      return this.store.get(key);
    }
  }

  del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  delPattern(pattern) {
    let count = 0;
    const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.del(key);
        count++;
      }
    }
    logger.debug(`[Cache] Invalidated ${count} keys matching pattern: ${pattern}`);
    return count;
  }

  flush() {
    this.store.clear();
    this.ttls.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getMetrics() {
    return {
      keysCount: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio:
        this.hits + this.misses > 0
          ? `${((this.hits / (this.hits + this.misses)) * 100).toFixed(1)}%`
          : '0.0%',
    };
  }
}

export const cache = new CacheEngine();

/**
 * Express middleware for automatic GET request caching
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 180s = 3 mins)
 */
export const cacheMiddleware = (ttlSeconds = 180) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `erp:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${req.user?.role || 'anon'}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to populate cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache keys matching prefix or pattern
 * @param {string} pattern - Key prefix/pattern, e.g. 'erp:/api/academics*'
 */
export const invalidateCache = (pattern) => {
  return cache.delPattern(pattern);
};

export default cache;
