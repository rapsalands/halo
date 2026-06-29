import type { GeoLocation } from '../../store/appState'
import { AIRNOW_KEY } from '../../lib/apiConfig'
import { pm25FromAqi } from '../../lib/aqi'
import type { AirQualityProvider } from './types'

/**
 * EPA AirNow (airnowapi.org) — US air quality, free key, commercial display OK
 * with attribution. Current observations report a US AQI per pollutant (not raw
 * concentration), so the overall AQI is the max across pollutants and we derive
 * PM2.5 concentration from its AQI. Needs VITE_AIRNOW_KEY.
 */
const BASE = 'https://www.airnowapi.org'

interface AirNowObs { ParameterName: string; AQI: number }

export const airNowAir: AirQualityProvider = {
  id: 'airnow',
  async fetchAirQuality(loc: GeoLocation) {
    const url = `${BASE}/aq/observation/latLong/current/?format=application/json`
      + `&latitude=${loc.lat.toFixed(4)}&longitude=${loc.lon.toFixed(4)}&distance=75&API_KEY=${AIRNOW_KEY}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`airnow ${res.status}`)
    const obs = (await res.json()) as AirNowObs[]
    if (!Array.isArray(obs) || obs.length === 0) throw new Error('airnow: no observations')
    const usAqi = Math.max(...obs.map((o) => o.AQI ?? 0))
    const pm = obs.find((o) => o.ParameterName === 'PM2.5')
    return { usAqi, pm25: pm25FromAqi(pm ? pm.AQI : usAqi) }
  },
}
