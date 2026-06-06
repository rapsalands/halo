import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOnThisDay } from './onThisDay'

afterEach(() => vi.restoreAllMocks())

describe('fetchOnThisDay', () => {
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
