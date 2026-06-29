import type { GeoLocation, Weather } from '../../store/appState'

export type { Weather }

/** Air-quality viewmodel — the provider-agnostic shape the UI consumes. */
export interface AirQuality { usAqi: number; pm25: number }

/**
 * A weather source. Each provider fetches from its own API and transforms the
 * raw response into our `Weather` viewmodel, so the rest of the app never sees
 * a provider-specific shape.
 */
export interface WeatherProvider {
  /** Stable id for logging/selection (e.g. 'open-meteo', 'nws'). */
  id: string
  fetchWeather(loc: GeoLocation): Promise<Weather>
}

/** An air-quality source, transforming its raw response into `AirQuality`. */
export interface AirQualityProvider {
  id: string
  fetchAirQuality(loc: GeoLocation): Promise<AirQuality>
}
