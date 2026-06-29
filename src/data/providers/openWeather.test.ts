import { describe, it, expect, vi, afterEach } from 'vitest'
import { openWeatherWeather, openWeatherAir, owmToWmo } from './openWeather'

afterEach(() => vi.restoreAllMocks())

describe('owmToWmo', () => {
  it('maps OpenWeather condition ids to WMO codes', () => {
    expect(owmToWmo(800)).toBe(0)
    expect(owmToWmo(801)).toBe(1)
    expect(owmToWmo(803)).toBe(3)
    expect(owmToWmo(500)).toBe(63)
    expect(owmToWmo(602)).toBe(73)
    expect(owmToWmo(211)).toBe(95)
    expect(owmToWmo(741)).toBe(45)
  })
})

const ONECALL = {
  timezone: 'Asia/Kolkata',
  current: { dt: 1_780_000_000, sunrise: 1_779_980_000, sunset: 1_780_020_000, temp: 30.4, feels_like: 33.1, humidity: 60, wind_speed: 5, weather: [{ id: 802 }] },
  hourly: [{ dt: 1_780_003_600, temp: 31, weather: [{ id: 500 }] }],
  daily: [{ dt: 1_780_000_000, sunrise: 1_779_980_000, sunset: 1_780_020_000, temp: { min: 26, max: 34 }, weather: [{ id: 802 }], uvi: 8 }],
}

describe('openWeather weather adapter', () => {
  it('maps One Call 3.0 into the Weather viewmodel (Celsius, km/h)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ONECALL })) as unknown as typeof fetch)
    const w = await openWeatherWeather.fetchWeather({ lat: 19.07, lon: 72.87, name: 'Mumbai', countryCode: 'IN' })
    expect(w.timezone).toBe('Asia/Kolkata')
    expect(w.temp).toBe(30)
    expect(w.feelsLike).toBe(33)
    expect(w.humidity).toBe(60)
    expect(w.windSpeed).toBe(18) // 5 m/s → 18 km/h
    expect(w.code).toBe(2) // 802 scattered clouds
    expect(w.isDay).toBe(true)
    expect(w.daily[0]).toMatchObject({ tempMax: 34, tempMin: 26, uvMax: 8, code: 2 })
    expect(w.hourly[0]).toMatchObject({ temp: 31, code: 63 })
  })
})

describe('openWeather air adapter', () => {
  it('derives US AQI from the PM2.5 concentration', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ list: [{ main: { aqi: 3 }, components: { pm2_5: 35.4 } }] }) })) as unknown as typeof fetch)
    const aq = await openWeatherAir.fetchAirQuality({ lat: 19.07, lon: 72.87, name: 'Mumbai' })
    expect(aq.pm25).toBe(35.4)
    expect(aq.usAqi).toBe(100)
  })
})
