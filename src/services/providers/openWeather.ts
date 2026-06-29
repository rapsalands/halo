import { API } from '../endpoints'
import type { GeoLocation, DailyForecast, HourlyForecast } from '../../store/appState'
import { OPENWEATHER_KEY } from '../../lib/apiConfig'
import { aqiFromPm25 } from '../../lib/aqi'
import type { WeatherProvider, AirQualityProvider } from './types'
import { toLocalIso } from './util'

/**
 * OpenWeather (api.openweathermap.org) — global, free tier allows commercial use
 * with attribution. Weather via One Call 3.0; AQI via the Air Pollution API
 * (returns PM2.5 concentration, so we derive US AQI from it). Needs
 * VITE_OPENWEATHER_KEY. Used as the global fallback for any country without a
 * dedicated provider.
 */
const BASE = API.openWeather

/** OpenWeather condition id → WMO code. */
export function owmToWmo(id: number): number {
  if (id >= 200 && id < 300) return 95 // thunderstorm
  if (id >= 300 && id < 400) return 53 // drizzle
  if (id === 511) return 66 // freezing rain
  if (id >= 500 && id < 600) return 63 // rain
  if (id === 611 || id === 612 || id === 613) return 66 // sleet
  if (id >= 600 && id < 700) return 73 // snow
  if (id >= 700 && id < 800) return 45 // fog/atmosphere
  if (id === 800) return 0 // clear
  if (id === 801) return 1 // few clouds
  if (id === 802) return 2 // scattered
  return 3 // broken / overcast
}

interface OwmCond { id: number }

export const openWeatherWeather: WeatherProvider = {
  id: 'openweather',
  async fetchWeather(loc: GeoLocation) {
    const url = `${BASE}/data/3.0/onecall?lat=${loc.lat}&lon=${loc.lon}&units=metric&exclude=minutely,alerts&appid=${OPENWEATHER_KEY}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`openweather ${res.status}`)
    const j = await res.json()
    const tz: string = j.timezone
    const c = j.current
    const daily: DailyForecast[] = (j.daily ?? []).slice(0, 7).map((d: {
      dt: number; sunrise: number; sunset: number; uvi: number
      temp: { min: number; max: number }; weather: OwmCond[]
    }) => ({
      date: toLocalIso(new Date(d.dt * 1000), tz).slice(0, 10),
      code: owmToWmo(d.weather[0].id),
      tempMax: Math.round(d.temp.max),
      tempMin: Math.round(d.temp.min),
      sunrise: toLocalIso(new Date(d.sunrise * 1000), tz),
      sunset: toLocalIso(new Date(d.sunset * 1000), tz),
      uvMax: d.uvi,
    }))
    const hourly: HourlyForecast[] = (j.hourly ?? []).slice(0, 12).map((h: {
      dt: number; temp: number; weather: OwmCond[]
    }) => ({
      time: toLocalIso(new Date(h.dt * 1000), tz),
      temp: Math.round(h.temp),
      code: owmToWmo(h.weather[0].id),
    }))
    return {
      code: owmToWmo(c.weather[0].id),
      isDay: c.dt >= c.sunrise && c.dt < c.sunset,
      temp: Math.round(c.temp),
      feelsLike: Math.round(c.feels_like),
      humidity: c.humidity,
      windSpeed: Math.round(c.wind_speed * 3.6), // m/s → km/h
      sunriseToday: daily[0]?.sunrise ?? toLocalIso(new Date(c.sunrise * 1000), tz),
      sunsetToday: daily[0]?.sunset ?? toLocalIso(new Date(c.sunset * 1000), tz),
      daily,
      hourly,
      stale: false,
      timezone: tz,
    }
  },
}

export const openWeatherAir: AirQualityProvider = {
  id: 'openweather',
  async fetchAirQuality(loc: GeoLocation) {
    const url = `${BASE}/data/2.5/air_pollution?lat=${loc.lat}&lon=${loc.lon}&appid=${OPENWEATHER_KEY}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`openweather air ${res.status}`)
    const j = await res.json()
    const pm25 = j.list?.[0]?.components?.pm2_5 ?? 0
    return { usAqi: aqiFromPm25(pm25), pm25 }
  },
}
