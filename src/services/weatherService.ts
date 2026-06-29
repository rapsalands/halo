import type { GeoLocation, Weather } from '../store/appState'
import type { WeatherProvider } from './providers/types'
import { nwsWeather } from './providers/nws'
import { openWeatherWeather } from './providers/openWeather'
import { fallbackWeather } from './providers/util'

/**
 * Per-country weather sources. A location's country code routes to its provider;
 * everything else uses the global default (OpenWeather). Every provider returns
 * the same `Weather` viewmodel. (`openMeteoWeather` is also available for
 * self-hosted setups — register it here to use it.)
 */
const WEATHER_BY_COUNTRY: Record<string, WeatherProvider> = {
  US: fallbackWeather(nwsWeather, openWeatherWeather), // NWS, then OpenWeather if it fails
  // IN: imdWeather, // IMD needs IP-whitelisting; India falls back to OpenWeather
}
const DEFAULT_WEATHER: WeatherProvider = openWeatherWeather

export function weatherProviderFor(loc: GeoLocation): WeatherProvider {
  return (loc.countryCode && WEATHER_BY_COUNTRY[loc.countryCode]) || DEFAULT_WEATHER
}

export function fetchWeather(loc: GeoLocation): Promise<Weather> {
  return weatherProviderFor(loc).fetchWeather(loc)
}
