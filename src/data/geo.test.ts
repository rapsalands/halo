import { describe, it, expect, vi, afterEach } from 'vitest'
import { ipLocate, geocodeCity } from './geo'

afterEach(() => vi.restoreAllMocks())

describe('ipLocate', () => {
  it('maps ipapi.co payload to a GeoLocation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ latitude: 28.6, longitude: 77.2, city: 'Delhi', country_code: 'IN' }),
    })) as unknown as typeof fetch)
    const loc = await ipLocate()
    expect(loc).toEqual({ lat: 28.6, lon: 77.2, name: 'Delhi' })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch)
    await expect(ipLocate()).rejects.toThrow()
  })
})

describe('geocodeCity', () => {
  it('returns the first geocoding result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [{ latitude: 51.5, longitude: -0.12, name: 'London', country: 'UK' }] }),
    })) as unknown as typeof fetch)
    const loc = await geocodeCity('London')
    expect(loc).toEqual({ lat: 51.5, lon: -0.12, name: 'London' })
  })

  it('returns null when there are no results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch)
    expect(await geocodeCity('zzzz')).toBeNull()
  })
})
