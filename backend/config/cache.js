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
    this.ttls.set(key, Date.now() + ttlSeconds * 1000);
  }

  get(key) {
    if (!this.store.has(key)) { this.misses++; return null; }
    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) { this.del(key); this.misses++; return null; }
    this.hits++;
    try { return JSON.parse(this.store.get(key)); } catch { return this.store.get(key); }
  }

  del(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  delPattern(pattern) {
    let count = 0;
    const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
    for (const key of this.store.keys()) {
      if (regex.test(key)) { this.del(key); count++; }
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
    const total = this.hits + this.misses;
    return {
      keysCount: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : '0.0%',
    };
  }
}

export const cache = new CacheEngine();

export const cacheMiddleware = (ttlSeconds = 180) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const cacheKey = `erp:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${req.user?.role || 'anon'}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cachedData);
  }

  res.setHeader('X-Cache', 'MISS');
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) cache.set(cacheKey, body, ttlSeconds);
    return originalJson(body);
  };
  next();
};

export const invalidateCache = (pattern) => cache.delPattern(pattern);
export default cache;
