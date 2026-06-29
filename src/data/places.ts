import type { GeoResult } from './geo'

/**
 * Offline, per-country place search. Each country ships as a compact JSON
 * (`public/places/<cc>.json`) of `[zip, city, state, lat, lon, pop]` rows,
 * listed in `public/places/index.json`. The kiosk lazy-loads whatever
 * countries are present and searches them in memory; callers fall back to a
 * network geocoder for anything not covered here.
 */

export interface PlacesManifestEntry { code: string; label: string; file: string; count?: number }

/** One CSV-distilled row: [zip, city, state, lat, lon, population, timezone?]. */
export type CompactRow = [string, string, string, number, number, number, string?]

interface Row { zip: string; city: string; state: string; lat: number; lon: number; pop: number; tz: string }

const rowsByCode = new Map<string, Row[]>()
/** Deduped best-population representative per city+state, sorted by pop desc. */
const citiesByCode = new Map<string, Row[]>()
const labelByCode = new Map<string, string>()
let loadStarted = false

/** Feed one country's rows into the in-memory indexes (also used by tests). */
export function ingestPlaces(code: string, label: string, raw: CompactRow[]): void {
  const cc = code.toUpperCase()
  const rows: Row[] = raw.map(([zip, city, state, lat, lon, pop, tz]) => ({ zip, city, state, lat, lon, pop, tz: tz ?? '' }))
  rowsByCode.set(cc, rows)
  labelByCode.set(cc, label)

  const best = new Map<string, Row>()
  for (const r of rows) {
    const key = `${r.city.toLowerCase()}|${r.state}`
    const cur = best.get(key)
    if (!cur || r.pop > cur.pop) best.set(key, r)
  }
  citiesByCode.set(cc, [...best.values()].sort((a, b) => b.pop - a.pop))
}

/** True once at least one country's data is resident. */
export function placesReady(): boolean { return rowsByCode.size > 0 }

/** Discard all loaded data (tests). */
export function resetPlaces(): void {
  rowsByCode.clear(); citiesByCode.clear(); labelByCode.clear(); loadStarted = false
}

function toResult(r: Row, cc: string): GeoResult {
  return {
    lat: r.lat, lon: r.lon, name: r.city,
    admin1: r.state, country: labelByCode.get(cc) ?? cc, countryCode: cc,
    timezone: r.tz || undefined,
  }
}

/**
 * Search loaded countries. A purely numeric query matches ZIP prefixes;
 * otherwise it matches city names (prefix first, then substring), ranked by
 * population so the largest place wins ties.
 */
export function searchPlaces(query: string, limit = 8): GeoResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const out: GeoResult[] = []
  const isZip = /^\d+$/.test(q)

  for (const [cc, rows] of rowsByCode) {
    if (isZip) {
      for (const r of rows) {
        if (r.zip.startsWith(q)) { out.push(toResult(r, cc)); if (out.length >= limit) return out }
      }
    } else {
      const cities = citiesByCode.get(cc) ?? []
      for (const r of cities) {
        if (r.city.toLowerCase().startsWith(q)) { out.push(toResult(r, cc)); if (out.length >= limit) return out }
      }
      for (const r of cities) {
        const name = r.city.toLowerCase()
        if (!name.startsWith(q) && name.includes(q)) { out.push(toResult(r, cc)); if (out.length >= limit) return out }
      }
    }
  }
  return out
}

/**
 * Fetch the manifest and every listed country file once, populating the
 * in-memory indexes. Idempotent and resolves even if individual files fail.
 */
export async function loadPlaces(base = '/places'): Promise<void> {
  if (loadStarted) return
  loadStarted = true
  let manifest: PlacesManifestEntry[]
  try {
    const res = await fetch(`${base}/index.json`)
    if (!res.ok) throw new Error(`places index ${res.status}`)
    manifest = await res.json()
  } catch (err) {
    loadStarted = false // allow a later retry once the network returns
    throw err
  }
  await Promise.all(manifest.map(async (e) => {
    try {
      const r = await fetch(`${base}/${e.file}`)
      if (!r.ok) return
      ingestPlaces(e.code, e.label, (await r.json()) as CompactRow[])
    } catch { /* skip a country whose file failed; others still work */ }
  }))
}
