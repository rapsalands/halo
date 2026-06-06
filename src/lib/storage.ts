const PREFIX = 'halo:'

export interface Cached<T> {
  value: T
  ts: number
}

export function saveCache<T>(key: string, value: T): void {
  try {
    const entry: Cached<T> = { value, ts: Date.now() }
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota or disabled storage — ignore, app keeps working from memory */
  }
}

export function loadCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached<T>
    if (typeof parsed?.ts !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function isStale<T>(entry: Cached<T>, maxAgeMs: number): boolean {
  return Date.now() - entry.ts > maxAgeMs
}
