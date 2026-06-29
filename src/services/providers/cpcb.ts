import { API } from '../endpoints'
import type { GeoLocation } from '../../store/appState'
import { DATA_GOV_IN_KEY } from '../../lib/apiConfig'
import { aqiFromPm25 } from '../../lib/aqi'
import type { AirQualityProvider } from './types'

/**
 * India CPCB real-time air quality via data.gov.in (NDSAP open data). The
 * resource lists every monitoring station's pollutant averages; we pick the
 * nearest station's PM2.5 and express it on the US-AQI scale the UI uses (so it
 * matches other providers). Needs VITE_DATA_GOV_IN_KEY.
 */
const RESOURCE = API.cpcbResource

interface CpcbRecord {
  latitude?: string
  longitude?: string
  pollutant_id?: string
  pollutant_avg?: string
  avg_value?: string
}

/** Cheap squared planar distance (good enough to pick the nearest station). */
function dist2(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dy = aLat - bLat
  const dx = (aLon - bLon) * Math.cos((aLat * Math.PI) / 180)
  return dy * dy + dx * dx
}

export const cpcbAir: AirQualityProvider = {
  id: 'cpcb',
  async fetchAirQuality(loc: GeoLocation) {
    const url = `${RESOURCE}?api-key=${DATA_GOV_IN_KEY}&format=json&limit=10000`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`cpcb ${res.status}`)
    const j = await res.json()
    const pm = ((j.records ?? []) as CpcbRecord[]).filter(
      (r) => r.pollutant_id === 'PM2.5' && r.latitude && r.longitude,
    )
    if (!pm.length) throw new Error('cpcb: no PM2.5 records')
    let best = pm[0]
    let bestD = Infinity
    for (const r of pm) {
      const d = dist2(loc.lat, loc.lon, Number(r.latitude), Number(r.longitude))
      if (d < bestD) { bestD = d; best = r }
    }
    const avg = Number(best.pollutant_avg ?? best.avg_value ?? 0)
    return { usAqi: aqiFromPm25(avg), pm25: avg }
  },
}
