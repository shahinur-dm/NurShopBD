/**
 * High-performance server-side in-memory cache for NUR SHOP BD catalog & data fetching.
 * Compatible with both Vercel Serverless Functions and VPS Node.js persistent processes.
 * Provides instant TTL caching with immediate cache invalidation upon Admin modifications.
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

declare global {
  var __nurshop_memory_cache: Map<string, CacheEntry<unknown>> | undefined;
}

const cache: Map<string, CacheEntry<unknown>> =
  globalThis.__nurshop_memory_cache ?? new Map<string, CacheEntry<unknown>>();

globalThis.__nurshop_memory_cache = cache;

const DEFAULT_TTL_MS = 120_000; // 2 minutes default cache

/**
 * Retrieve an item from the cache if not expired.
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store an item in the cache with a specified TTL.
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): T {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
  return data;
}

/**
 * Execute a fetcher function with caching.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const result = await fetcher();
  if (result !== null && result !== undefined) {
    setCache(key, result, ttlMs);
  }
  return result;
}

/**
 * Invalidate specific cache keys or key patterns (e.g. "products", "categories", "settings").
 * Called immediately during Admin CRUD mutations.
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    cache.delete(key);
  }
}

/**
 * Clear all cache entries.
 */
export function clearAllCache(): void {
  cache.clear();
}
