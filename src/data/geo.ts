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
