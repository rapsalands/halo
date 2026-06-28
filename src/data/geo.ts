import type { GeoLocation } from '../store/appState'

export async function ipLocate(): Promise<GeoLocation> {
  const res = await fetch('https://ipapi.co/json/')
  if (!res.ok) throw new Error(`ipapi ${res.status}`)
  const j = await res.json()
  if (typeof j.latitude !== 'number' || typeof j.longitude !== 'number') {
    throw new Error('ipapi: no coordinates')
  }
  return { lat: j.latitude, lon: j.longitude, name: j.city ?? 'Current location' }
}

export async function geocodeCity(query: string): Promise<GeoLocation | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocoding ${res.status}`)
  const j = await res.json()
  const first = j.results?.[0]
  if (!first) return null
  return { lat: first.latitude, lon: first.longitude, name: first.name }
}

/** One geocoding match, with enough context to disambiguate same-named places. */
export interface GeoResult {
  lat: number
  lon: number
  name: string
  admin1?: string
  country?: string
  countryCode?: string
}

/** Search for places matching `query`, returning up to `count` suggestions. */
export async function geocodeSearch(query: string, count = 8): Promise<GeoResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocoding ${res.status}`)
  const j = await res.json()
  return (j.results ?? []).map((r: {
    latitude: number; longitude: number; name: string
    admin1?: string; country?: string; country_code?: string
  }) => ({
    lat: r.latitude, lon: r.longitude, name: r.name,
    admin1: r.admin1, country: r.country, countryCode: r.country_code,
  }))
}
