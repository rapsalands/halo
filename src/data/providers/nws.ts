import type { GeoLocation, DailyForecast, HourlyForecast } from '../../store/appState'
import { sunTimes } from '../../lib/sun'
import type { WeatherProvider } from './types'

/**
 * US National Weather Service (api.weather.gov) — free, no key, public-domain
 * data. Two-step API: /points/{lat,lon} → forecast + forecastHourly URLs. We
 * request `units=si` (Celsius, km/h) to match the viewmodel, map NWS's text
 * conditions to WMO codes, and compute sunrise/sunset locally (NWS omits them).
 */
const BASE = 'https://api.weather.gov'

interface NwsPeriod {
  startTime: string
  isDaytime: boolean
  temperature: number
  shortForecast: string
  windSpeed: string
  relativeHumidity?: { value: number | null }
}

async function getJson(url: string): Promise<{ properties: Record<string, unknown> }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`nws ${res.status}`)
  return res.json()
}

/** Map an NWS shortForecast phrase to the nearest WMO weather code. */
export function textToWmo(text: string): number {
  const t = (text || '').toLowerCase()
  if (t.includes('thunder')) return 95
  if (t.includes('freezing rain') || t.includes('sleet') || t.includes('ice')) return 66
  if (t.includes('snow') || t.includes('flurr') || t.includes('blizzard')) return 73
  if (t.includes('drizzle')) return 53
  if (t.includes('rain') || t.includes('shower')) return 63
  if (t.includes('fog') || t.includes('haze') || t.includes('mist')) return 45
  if (t.includes('overcast') || t.includes('cloudy')) return 3
  if (t.includes('partly') || t.includes('mostly sunny')) return 2
  if (t.includes('mostly clear')) return 1
  if (t.includes('clear') || t.includes('sunny') || t.includes('fair')) return 0
  return 2
}

/** Format a UTC instant as a naive local "YYYY-MM-DDTHH:mm" in `timeZone`. */
function toLocalIso(d: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (t: string) => parts.find((p) => p.type === t)!.value
  const hh = g('hour') === '24' ? '00' : g('hour')
  return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`
}

function buildDaily(periods: NwsPeriod[], loc: GeoLocation, tz: string): DailyForecast[] {
  const byDate = new Map<string, { max?: number; min?: number; code?: number }>()
  const order: string[] = []
  for (const p of periods) {
    const date = p.startTime.slice(0, 10) // local date (startTime carries the offset)
    if (!byDate.has(date)) { byDate.set(date, {}); order.push(date) }
    const e = byDate.get(date)!
    if (p.isDaytime) { e.max = Math.round(p.temperature); e.code = textToWmo(p.shortForecast) }
    else { e.min = Math.round(p.temperature) }
  }
  return order.slice(0, 7).map((date) => {
    const e = byDate.get(date)!
    const s = sunTimes(new Date(`${date}T00:00:00Z`), loc.lat, loc.lon)
    return {
      date,
      code: e.code ?? 2,
      tempMax: e.max ?? e.min ?? 0,
      tempMin: e.min ?? e.max ?? 0,
      sunrise: s.sunrise ? toLocalIso(s.sunrise, tz) : '',
      sunset: s.sunset ? toLocalIso(s.sunset, tz) : '',
      uvMax: 0, // NWS basic forecast has no UV index
    }
  })
}

export const nwsWeather: WeatherProvider = {
  id: 'nws',
  async fetchWeather(loc: GeoLocation) {
    const pts = await getJson(`${BASE}/points/${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`)
    const tz = String(pts.properties.timeZone)
    const [fc, hr] = await Promise.all([
      getJson(`${String(pts.properties.forecast)}?units=si`),
      getJson(`${String(pts.properties.forecastHourly)}?units=si`),
    ])
    const hourlyPeriods = hr.properties.periods as NwsPeriod[]
    const cur = hourlyPeriods[0]
    const hourly: HourlyForecast[] = hourlyPeriods.slice(0, 12).map((p) => ({
      time: p.startTime,
      temp: Math.round(p.temperature),
      code: textToWmo(p.shortForecast),
    }))
    const daily = buildDaily(fc.properties.periods as NwsPeriod[], loc, tz)
    return {
      code: textToWmo(cur.shortForecast),
      isDay: cur.isDaytime,
      temp: Math.round(cur.temperature),
      feelsLike: Math.round(cur.temperature), // NWS hourly has no apparent temp
      humidity: cur.relativeHumidity?.value ?? 0,
      windSpeed: Math.round(parseFloat(cur.windSpeed) || 0),
      sunriseToday: daily[0]?.sunrise ?? '',
      sunsetToday: daily[0]?.sunset ?? '',
      daily,
      hourly,
      stale: false,
      timezone: tz,
    }
  },
}
