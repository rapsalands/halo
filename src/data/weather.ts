import type { GeoLocation, Weather, DailyForecast, HourlyForecast } from '../store/appState'
import { WEATHER_API_BASE } from '../lib/apiConfig'

export async function fetchWeather(loc: GeoLocation): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${WEATHER_API_BASE}/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const j = await res.json()
  const c = j.current
  const d = j.daily
  const daily: DailyForecast[] = d.time.map((date: string, i: number) => ({
    date,
    code: d.weather_code[i],
    tempMax: Math.round(d.temperature_2m_max[i]),
    tempMin: Math.round(d.temperature_2m_min[i]),
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
    uvMax: d.uv_index_max[i],
  }))
  const hourly: HourlyForecast[] = buildHourly(j.hourly)
  return {
    code: c.weather_code,
    isDay: c.is_day === 1,
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    sunriseToday: daily[0].sunrise,
    sunsetToday: daily[0].sunset,
    daily,
    hourly,
    stale: false,
    timezone: typeof j.timezone === 'string' ? j.timezone : undefined,
  }
}

/** Map the hourly arrays into the next 12 hours from now. */
function buildHourly(h: { time: string[]; temperature_2m: number[]; weather_code: number[] } | undefined): HourlyForecast[] {
  if (!h?.time) return []
  const nowMs = Date.now()
  const all: HourlyForecast[] = h.time.map((time, i) => ({
    time,
    temp: Math.round(h.temperature_2m[i]),
    code: h.weather_code[i],
  }))
  const startIdx = all.findIndex((e) => new Date(e.time).getTime() >= nowMs)
  const from = startIdx === -1 ? 0 : startIdx
  return all.slice(from, from + 12)
}
