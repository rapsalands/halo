import type { GeoLocation, Weather } from '../store/appState'
import type { WeatherProvider } from './providers/types'
import { openMeteoWeather } from './providers/openMeteo'

/**
 * Per-country weather sources. Register a provider for a country code (e.g.
 * `US: nwsWeather`) and locations there use it; everything else uses the global
 * default. Every provider returns the same `Weather` viewmodel.
 */
const WEATHER_BY_COUNTRY: Record<string, WeatherProvider> = {
  // US: nwsWeather,   // add when implemented
  // IN: imdWeather,
}
const DEFAULT_WEATHER: WeatherProvider = openMeteoWeather

export function weatherProviderFor(loc: GeoLocation): WeatherProvider {
  return (loc.countryCode && WEATHER_BY_COUNTRY[loc.countryCode]) || DEFAULT_WEATHER
}

export function fetchWeather(loc: GeoLocation): Promise<Weather> {
  return weatherProviderFor(loc).fetchWeather(loc)
}
