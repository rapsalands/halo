import type { Weather, DailyForecast, HourlyForecast } from '../store/appState'

export interface DemoOverride { code: number; isDay: boolean }

/** Named preview presets → a representative WMO code + day/night. */
export const DEMO_PRESETS: Record<string, DemoOverride> = {
  rain: { code: 63, isDay: true },
  thunder: { code: 95, isDay: true },
  snow: { code: 73, isDay: true },
  clear: { code: 0, isDay: true },
  night: { code: 0, isDay: false },
  cloudy: { code: 3, isDay: true },
  fog: { code: 45, isDay: true },
}

/** Read `?demo=rain` (etc.) from a query string. */
export function parseDemo(search: string): DemoOverride | null {
  const name = new URLSearchParams(search).get('demo')
  if (!name) return null
  return DEMO_PRESETS[name.toLowerCase()] ?? null
}

/** Force a weather object's condition (and all its forecasts) to the override. */
export function applyDemo(w: Weather, o: DemoOverride): Weather {
  return {
    ...w,
    code: o.code,
    isDay: o.isDay,
    daily: w.daily.map((d) => ({ ...d, code: o.code })),
    hourly: w.hourly.map((h) => ({ ...h, code: o.code })),
  }
}

function pad(n: number): string { return n.toString().padStart(2, '0') }
function localISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** A complete plausible weather object for instant preview before/without a fetch. */
export function synthDemoWeather(o: DemoOverride, now: Date): Weather {
  const sunrise = new Date(now); sunrise.setHours(6, 0, 0, 0)
  const sunset = new Date(now); sunset.setHours(19, 0, 0, 0)
  const daily: DailyForecast[] = Array.from({ length: 5 }, (_, i) => {
    const day = new Date(now); day.setDate(now.getDate() + i)
    return {
      date: localISO(day).slice(0, 10),
      code: o.code, tempMax: 24 - i, tempMin: 16 - i,
      sunrise: localISO(sunrise), sunset: localISO(sunset), uvMax: 5,
    }
  })
  const hourly: HourlyForecast[] = Array.from({ length: 8 }, (_, i) => {
    const h = new Date(now); h.setHours(now.getHours() + i, 0, 0, 0)
    return { time: localISO(h), temp: 22 - (i % 3), code: o.code }
  })
  return {
    code: o.code, isDay: o.isDay, temp: 22, feelsLike: 21, humidity: 70, windSpeed: 8,
    sunriseToday: localISO(sunrise), sunsetToday: localISO(sunset), daily, hourly, stale: false,
  }
}
