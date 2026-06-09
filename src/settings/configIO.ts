import type { Settings } from '../store/defaults'

export function encodeConfig(settings: Settings): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(settings))))
}

export function decodeConfig(blob: string): Partial<Settings> | null {
  try {
    const json = decodeURIComponent(escape(atob(blob)))
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object') return parsed as Partial<Settings>
    return null
  } catch {
    return null
  }
}

export function readConfigFromSearch(search: string): Partial<Settings> | null {
  const param = new URLSearchParams(search).get('config')
  if (!param) return null
  return decodeConfig(param)
}

/**
 * Explicit, human-readable location override via query params:
 *   ?lat=<number>&lon=<number>[&place=<label>]
 *
 * This is the contract the DashMate kiosk uses to hand Halo the customer's
 * configured ZIP location (lat/lon resolved on the device). Readable and
 * debuggable, unlike the opaque base64 `?config=`. Returns null unless BOTH
 * lat and lon are finite numbers, so a normal URL is unaffected.
 */
export function readLocationFromSearch(search: string): Partial<Settings> | null {
  const p = new URLSearchParams(search)
  const latRaw = p.get('lat')
  const lonRaw = p.get('lon')
  // Reject absent/empty params: Number(null) and Number('') are both 0, which
  // would otherwise resolve a bare URL to Null Island (0,0).
  if (!latRaw || !lonRaw) return null
  const lat = Number(latRaw)
  const lon = Number(lonRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const name = (p.get('place') || p.get('loc') || 'Configured location').trim()
  return { location: { lat, lon, name } }
}
