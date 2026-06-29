import { describe, it, expect, vi, afterEach } from 'vitest'
import { ipLocate } from './geoService'

afterEach(() => vi.restoreAllMocks())

describe('ipLocate', () => {
  it('maps ipapi.co payload to a GeoLocation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ latitude: 28.6, longitude: 77.2, city: 'Delhi', country_code: 'IN' }),
    })) as unknown as typeof fetch)
    const loc = await ipLocate()
    expect(loc).toEqual({ lat: 28.6, lon: 77.2, name: 'Delhi', countryCode: 'IN' })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch)
    await expect(ipLocate()).rejects.toThrow()
  })
})
