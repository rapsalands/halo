import type { GeoLocation } from '../store/appState'
import type { AirQuality, AirQualityProvider } from './providers/types'
import { openMeteoAir } from './providers/openMeteo'

export type { AirQuality }

/**
 * Per-country air-quality sources (e.g. `US: airNow`, `IN: cpcb`); everything
 * else uses the global default. Every provider returns the same `AirQuality`.
 */
const AIR_BY_COUNTRY: Record<string, AirQualityProvider> = {
  // US: airNow,   // add when implemented
  // IN: cpcb,
}
const DEFAULT_AIR: AirQualityProvider = openMeteoAir

export function airProviderFor(loc: GeoLocation): AirQualityProvider {
  return (loc.countryCode && AIR_BY_COUNTRY[loc.countryCode]) || DEFAULT_AIR
}

export function fetchAirQuality(loc: GeoLocation): Promise<AirQuality> {
  return airProviderFor(loc).fetchAirQuality(loc)
}
