import type { GeoLocation } from '../store/appState'

export async function ipLocate(): Promise<GeoLocation> {
  const res = await fetch('https://ipapi.co/json/')
  if (!res.ok) throw new Error(`ipapi ${res.status}`)
  const j = await res.json()
  if (typeof j.latitude !== 'number' || typeof j.longitude !== 'number') {
    throw new Error('ipapi: no coordinates')
  }
  return {
    lat: j.latitude, lon: j.longitude, name: j.city ?? 'Current location',
    countryCode: typeof j.country_code === 'string' ? j.country_code : undefined,
  }
}

/** One place match, with enough context to disambiguate same-named places. */
export interface GeoResult {
  lat: number
  lon: number
  name: string
  admin1?: string
  country?: string
  countryCode?: string
  /** IANA timezone for the place, when the bundled data provides one. */
  timezone?: string
}
