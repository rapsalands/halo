import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOnThisDay } from './onThisDay'

afterEach(() => vi.restoreAllMocks())

describe('fetchOnThisDay', () => {
  it('reads the bundled dataset first, without touching Wikipedia', async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.includes('/onthisday.json')) {
        return { ok: true, json: async () => ({ '06-06': [{ year: 1944, text: 'D-Day' }] }) } as unknown as Response
      }
      return { ok: false, status: 500 } as Response
    })
    vi.stubGlobal('fetch', fetchSpy)
    const e = await fetchOnThisDay(new Date(2026, 5, 6)) // June 6
    expect(e).toEqual({ year: 1944, text: 'D-Day' })
    expect(fetchSpy).toHaveBeenCalledTimes(1) // local hit, no Wikipedia fallback
  })

  it('returns the first event', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ events: [{ year: 1969, text: 'Something happened' }] }),
    })) as unknown as typeof fetch)
    const e = await fetchOnThisDay(new Date(2026, 5, 6))
    expect(e).toEqual({ year: 1969, text: 'Something happened' })
  })
  it('returns null when there are no events', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ events: [] }) })) as unknown as typeof fetch)
    expect(await fetchOnThisDay(new Date(2026, 5, 6))).toBeNull()
  })
})
