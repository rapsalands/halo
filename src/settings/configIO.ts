import type { Settings } from '../store/defaults'
import { sanitizeSettings } from '../store/sanitizeSettings'

export function encodeConfig(settings: Settings): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(settings))))
}

export function decodeConfig(blob: string): Partial<Settings> | null {
  try {
    const json = decodeURIComponent(escape(atob(blob)))
    // Never trust the decoded shape: validate every field and drop anything
    // unknown/ill-typed so a hostile or stale `?config=` cannot poison state.
    return sanitizeSettings(JSON.parse(json))
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
  // Reject impossible coordinates so a malformed hand-off can't drive the weather
  // feed to a garbage point; cap the label so it can't blow up the clock tile.
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
  const name = (p.get('place') || p.get('loc') || 'Configured location').trim().slice(0, 60)
  return { location: { lat, lon, name } }
}
