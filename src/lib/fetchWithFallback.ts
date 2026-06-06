import { saveCache, loadCache } from './storage'

export interface FetchResult<T> {
  data: T
  stale: boolean
  ts: number
}

/**
 * Run `fetcher` (network + parse). On success, cache the result and return it
 * fresh. On failure, return the last cached value flagged stale. If there is no
 * cache at all, rethrow so the caller can show an empty state.
 */
export async function fetchWithFallback<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<FetchResult<T>> {
  try {
    const data = await fetcher()
    saveCache(cacheKey, data)
    return { data, stale: false, ts: Date.now() }
  } catch (err) {
    const cached = loadCache<T>(cacheKey)
    if (cached) return { data: cached.value, stale: true, ts: cached.ts }
    throw err
  }
}
