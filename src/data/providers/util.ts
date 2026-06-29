import type { WeatherProvider, AirQualityProvider } from './types'

/** Try each weather provider in order; the next one runs only if the prior throws. */
export function fallbackWeather(...providers: WeatherProvider[]): WeatherProvider {
  return {
    id: providers.map((p) => p.id).join('+'),
    async fetchWeather(loc) {
      let last: unknown
      for (const p of providers) {
        try { return await p.fetchWeather(loc) } catch (e) { last = e }
      }
      throw last
    },
  }
}

/** Try each air-quality provider in order; the next runs only if the prior throws. */
export function fallbackAir(...providers: AirQualityProvider[]): AirQualityProvider {
  return {
    id: providers.map((p) => p.id).join('+'),
    async fetchAirQuality(loc) {
      let last: unknown
      for (const p of providers) {
        try { return await p.fetchAirQuality(loc) } catch (e) { last = e }
      }
      throw last
    },
  }
}

/** Format a UTC instant as a naive local "YYYY-MM-DDTHH:mm" in `timeZone`,
 *  matching the local-time strings the clock/sun tiles expect. */
export function toLocalIso(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (t: string) => parts.find((p) => p.type === t)!.value
  const hh = g('hour') === '24' ? '00' : g('hour')
  return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`
}
