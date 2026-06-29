import type { GeoLocation } from '../store/appState'
import type { AirQuality, AirQualityProvider } from './providers/types'
import { airNowAir } from './providers/airNow'
import { cpcbAir } from './providers/cpcb'
import { openWeatherAir } from './providers/openWeather'

export type { AirQuality }

/**
 * Per-country air-quality sources; everything else uses the global default
 * (OpenWeather). Every provider returns the same `AirQuality` viewmodel.
 */
const AIR_BY_COUNTRY: Record<string, AirQualityProvider> = {
  US: airNowAir, // EPA AirNow
  IN: cpcbAir, // CPCB via data.gov.in
}
const DEFAULT_AIR: AirQualityProvider = openWeatherAir

export function airProviderFor(loc: GeoLocation): AirQualityProvider {
  return (loc.countryCode && AIR_BY_COUNTRY[loc.countryCode]) || DEFAULT_AIR
}

export function fetchAirQuality(loc: GeoLocation): Promise<AirQuality> {
  return airProviderFor(loc).fetchAirQuality(loc)
}
