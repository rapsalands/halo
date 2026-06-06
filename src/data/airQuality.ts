import type { GeoLocation } from '../store/appState'

export interface AirQuality { usAqi: number; pm25: number }

export async function fetchAirQuality(loc: GeoLocation): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'us_aqi,pm2_5',
  })
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
  if (!res.ok) throw new Error(`air-quality ${res.status}`)
  const j = await res.json()
  return { usAqi: j.current.us_aqi, pm25: j.current.pm2_5 }
}
