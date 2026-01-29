/**
 * Simple in-memory cache with TTL support for API responses
 * Reduces repeated calls when navigating between dates/filters
 */

type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>()

  /**
   * Get cached data if it exists and hasn't expired
   * @param key Cache key
   * @returns Cached data or undefined if not found/expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  /**
   * Store data in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if a key exists and is still valid
   * @param key Cache key
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Remove a specific key from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    this.cache.forEach(entry => {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        active++
      }
    })

    return {
      total: this.cache.size,
      active,
      expired,
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    })

    return cleaned
  }
}

/**
 * Build a cache key from an object's properties
 * @param base Base key prefix
 * @param params Object with parameters to include in key
 */
export function buildCacheKey(
  base: string,
  params: Record<string, string | number | boolean | undefined> = {},
): string {
  const sortedKeys = Object.keys(params).sort()
  const keyParts = sortedKeys
    .filter(key => params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)

  return keyParts.length > 0 ? `${base}:${keyParts.join(":")}` : base
}

// Export singleton instances for common cache types
export const professionalsCache = new SimpleCache<{
  data: unknown[]
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}>()

export const availabilityCache = new SimpleCache<
  Array<{
    date: string
    time: string
    is_available: boolean
    reason?: string
  }>
>()

export const appointmentsCache = new SimpleCache<{
  appointments: unknown[]
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}>()

// Periodic cleanup to prevent memory leaks
if (typeof window !== "undefined") {
  setInterval(() => {
    professionalsCache.cleanup()
    availabilityCache.cleanup()
    appointmentsCache.cleanup()
  }, 10 * 60 * 1000) // Clean every 10 minutes
}

export { SimpleCache }
