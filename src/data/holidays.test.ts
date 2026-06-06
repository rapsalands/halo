import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchHolidays } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('fetchHolidays', () => {
  it('maps Nager.Date payload to {date,name}', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { date: '2026-01-26', localName: 'Republic Day', name: 'Republic Day' },
        { date: '2026-08-15', localName: 'Independence Day', name: 'Independence Day' },
      ],
    })) as unknown as typeof fetch)
    const hs = await fetchHolidays(2026, 'IN')
    expect(hs).toEqual([
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-08-15', name: 'Independence Day' },
    ])
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch)
    await expect(fetchHolidays(2026, 'ZZ')).rejects.toThrow()
  })
})
