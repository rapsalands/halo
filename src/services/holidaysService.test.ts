import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchHolidays, fetchCountries } from './holidaysService'

/** Mock fetch that responds based on a substring match of the requested URL. */
function mockFetch(map: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const key = Object.keys(map).find((k) => url.includes(k))
    if (!key) return { ok: false, status: 404 } as Response
    return { ok: true, json: async () => map[key] } as unknown as Response
  })
}

afterEach(() => vi.restoreAllMocks())

describe('fetchHolidays', () => {
  it('reads bundled local data first, without touching the network', async () => {
    const fetchSpy = mockFetch({
      '/holidays/us.json': { 2026: [{ date: '2026-07-04', name: 'Independence Day' }] },
    })
    vi.stubGlobal('fetch', fetchSpy)
    const h = await fetchHolidays(2026, 'US')
    expect(h).toEqual([{ date: '2026-07-04', name: 'Independence Day' }])
    expect(fetchSpy).toHaveBeenCalledTimes(1) // local hit, no Nager fallback
  })

  it('falls back to Nager and maps its payload when the year is not bundled', async () => {
    vi.stubGlobal('fetch', mockFetch({
      '/holidays/in.json': { 2026: [] }, // no 2030 entry
      'date.nager.at': [
        { date: '2030-01-26', localName: 'Republic Day', name: 'Republic Day' },
        { date: '2030-08-15', localName: 'Independence Day', name: 'Independence Day' },
      ],
    }))
    const hs = await fetchHolidays(2030, 'IN')
    expect(hs).toEqual([
      { date: '2030-01-26', name: 'Republic Day' },
      { date: '2030-08-15', name: 'Independence Day' },
    ])
  })

  it('throws when neither local nor Nager has the data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch)
    await expect(fetchHolidays(2026, 'ZZ')).rejects.toThrow()
  })
})

describe('fetchCountries', () => {
  it('reads the bundled country list first', async () => {
    const fetchSpy = mockFetch({
      '/holidays/countries.json': [{ code: 'US', name: 'United States' }],
    })
    vi.stubGlobal('fetch', fetchSpy)
    expect(await fetchCountries()).toEqual([{ code: 'US', name: 'United States' }])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
