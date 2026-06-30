import { usePolledData, type PolledState } from './usePolledData'
import { POLL } from '../lib/intervals'
import { fetchAirQuality, type AirQuality } from '../services/airQualityService'
import type { GeoLocation } from '../store/appState'

/** Air quality for a location (or a parked poller when none is resolved yet). */
export function useAirQuality(location: GeoLocation | null): PolledState<AirQuality> {
  return usePolledData<AirQuality>(
    location ? `aqi:${location.lat},${location.lon}` : 'aqi:none',
    () => fetchAirQuality(location!),
    POLL.airQuality,
  )
}
