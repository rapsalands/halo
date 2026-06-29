import { describe, it, expect, vi, afterEach } from 'vitest'
import { airNowAir } from './airNow'

afterEach(() => vi.restoreAllMocks())

describe('airNow air adapter', () => {
  it('takes the max AQI across pollutants and derives PM2.5', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { ParameterName: 'O3', AQI: 42 },
        { ParameterName: 'PM2.5', AQI: 80 },
      ],
    })) as unknown as typeof fetch)
    const aq = await airNowAir.fetchAirQuality({ lat: 40.71, lon: -74.01, name: 'NY', countryCode: 'US' })
    expect(aq.usAqi).toBe(80)
    expect(aq.pm25).toBeGreaterThan(0)
  })

  it('throws when there are no observations', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })) as unknown as typeof fetch)
    await expect(airNowAir.fetchAirQuality({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
