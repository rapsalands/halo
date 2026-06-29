import { describe, it, expect, vi, afterEach } from 'vitest'
import { nwsWeather, textToWmo } from './nws'

afterEach(() => vi.restoreAllMocks())

/** Mock fetch keyed by URL substring (longest key wins, so hourly beats forecast). */
function mockFetch(map: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const key = Object.keys(map).sort((a, b) => b.length - a.length).find((k) => url.includes(k))
    if (!key) return { ok: false, status: 404 } as Response
    return { ok: true, json: async () => map[key] } as unknown as Response
  })
}

const POINTS = {
  properties: {
    timeZone: 'America/New_York',
    forecast: 'https://api.weather.gov/gridpoints/OKX/33,35/forecast',
    forecastHourly: 'https://api.weather.gov/gridpoints/OKX/33,35/forecast/hourly',
  },
}
const HOURLY = {
  properties: {
    periods: [
      { startTime: '2026-06-06T10:00:00-04:00', isDaytime: true, temperature: 22, shortForecast: 'Sunny', windSpeed: '16 km/h', relativeHumidity: { value: 55 } },
      { startTime: '2026-06-06T11:00:00-04:00', isDaytime: true, temperature: 23, shortForecast: 'Partly Sunny', windSpeed: '14 km/h', relativeHumidity: { value: 52 } },
    ],
  },
}
const FORECAST = {
  properties: {
    periods: [
      { startTime: '2026-06-06T06:00:00-04:00', isDaytime: true, temperature: 25, shortForecast: 'Partly Sunny', windSpeed: '15 km/h' },
      { startTime: '2026-06-06T18:00:00-04:00', isDaytime: false, temperature: 15, shortForecast: 'Clear', windSpeed: '8 km/h' },
      { startTime: '2026-06-07T06:00:00-04:00', isDaytime: true, temperature: 28, shortForecast: 'Chance Rain Showers', windSpeed: '20 km/h' },
    ],
  },
}

describe('textToWmo', () => {
  it('maps NWS phrases to WMO codes', () => {
    expect(textToWmo('Sunny')).toBe(0)
    expect(textToWmo('Partly Sunny')).toBe(2)
    expect(textToWmo('Mostly Cloudy')).toBe(3)
    expect(textToWmo('Chance Rain Showers')).toBe(63)
    expect(textToWmo('Scattered Thunderstorms')).toBe(95)
    expect(textToWmo('Snow Likely')).toBe(73)
    expect(textToWmo('Patchy Fog')).toBe(45)
  })
})

describe('nwsWeather', () => {
  it('transforms the two-step NWS response into the Weather viewmodel', async () => {
    vi.stubGlobal('fetch', mockFetch({
      '/points/': POINTS,
      '/forecast/hourly': HOURLY,
      '/forecast': FORECAST,
    }))
    const w = await nwsWeather.fetchWeather({ lat: 40.7128, lon: -74.006, name: 'New York', countryCode: 'US' })

    expect(w.timezone).toBe('America/New_York')
    expect(w.temp).toBe(22)
    expect(w.code).toBe(0) // Sunny
    expect(w.isDay).toBe(true)
    expect(w.humidity).toBe(55)
    expect(w.windSpeed).toBe(16)
    expect(w.hourly).toHaveLength(2)

    // Day 1 pairs the daytime high with the nighttime low.
    expect(w.daily[0]).toMatchObject({ date: '2026-06-06', tempMax: 25, tempMin: 15, code: 2 })
    expect(w.daily[1]).toMatchObject({ date: '2026-06-07', tempMax: 28, code: 63 })
    // Sunrise/sunset are computed locally and rendered in the location tz.
    expect(w.sunriseToday).toMatch(/^2026-06-06T0[45]:\d\d$/)
    expect(w.sunsetToday).toMatch(/^2026-06-06T20:\d\d$/)
  })

  it('requests Celsius (units=si)', async () => {
    const spy = mockFetch({ '/points/': POINTS, '/forecast/hourly': HOURLY, '/forecast': FORECAST })
    vi.stubGlobal('fetch', spy)
    await nwsWeather.fetchWeather({ lat: 40.7128, lon: -74.006, name: 'NY', countryCode: 'US' })
    expect(spy.mock.calls.some(([u]) => String(u).includes('/forecast/hourly?units=si'))).toBe(true)
  })
})
