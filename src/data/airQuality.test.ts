import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchAirQuality } from './airQuality'

afterEach(() => vi.restoreAllMocks())

describe('fetchAirQuality', () => {
  it('maps the air-quality feed payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ current: { us_aqi: 42, pm2_5: 9.1 } }),
    })) as unknown as typeof fetch)
    const aq = await fetchAirQuality({ lat: 28.6, lon: 77.2, name: 'Delhi' })
    expect(aq).toEqual({ usAqi: 42, pm25: 9.1 })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch)
    await expect(fetchAirQuality({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
