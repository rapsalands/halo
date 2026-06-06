import { useEffect, useRef, useState } from 'react'
import { fetchWithFallback } from '../lib/fetchWithFallback'

export interface PolledState<T> { data: T | null; stale: boolean; error: boolean }

/**
 * Fetch `fetcher` through the last-known-good cache under `key`, then re-poll
 * every `intervalMs`. The fetcher is read from a ref so inline closures don't
 * restart the interval on every render.
 */
export function usePolledData<T>(
  key: string,
  fetcher: () => Promise<T>,
  intervalMs: number,
): PolledState<T> {
  const [state, setState] = useState<PolledState<T>>({ data: null, stale: false, error: false })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetchWithFallback(key, () => fetcherRef.current())
        if (!cancelled) setState({ data: res.data, stale: res.stale, error: false })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, error: true }))
      }
    }
    run()
    const id = setInterval(run, intervalMs)
    return () => { cancelled = true; clearInterval(id) }
  }, [key, intervalMs])

  return state
}
