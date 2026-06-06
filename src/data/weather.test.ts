import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeather } from './weather'

afterEach(() => vi.restoreAllMocks())

const SAMPLE = {
  current: {
    temperature_2m: 24.3, apparent_temperature: 23.1, relative_humidity_2m: 40,
    is_day: 1, weather_code: 3, wind_speed_10m: 12,
  },
  daily: {
    time: ['2026-06-06', '2026-06-07'],
    weather_code: [3, 0],
    temperature_2m_max: [27, 29],
    temperature_2m_min: [18, 19],
    sunrise: ['2026-06-06T05:30', '2026-06-07T05:30'],
    sunset: ['2026-06-06T19:30', '2026-06-07T19:31'],
    uv_index_max: [6, 7],
  },
}

describe('fetchWeather', () => {
  it('parses Open-Meteo current + daily into a Weather object', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => SAMPLE })) as unknown as typeof fetch)
    const w = await fetchWeather({ lat: 28.6, lon: 77.2, name: 'Delhi' })
    expect(w.temp).toBe(24)            // rounded
    expect(w.isDay).toBe(true)
    expect(w.code).toBe(3)
    expect(w.daily).toHaveLength(2)
    expect(w.daily[0].tempMax).toBe(27)
    expect(w.sunriseToday).toBe('2026-06-06T05:30')
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch)
    await expect(fetchWeather({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
