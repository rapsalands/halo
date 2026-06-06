import type { GeoLocation, Weather, DailyForecast } from '../store/appState'

export async function fetchWeather(loc: GeoLocation): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
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
    stale: false,
  }
}
