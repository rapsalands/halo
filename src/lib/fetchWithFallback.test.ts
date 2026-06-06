import { describe, it, expect, beforeEach } from 'vitest'
import { fetchWithFallback } from './fetchWithFallback'

describe('fetchWithFallback', () => {
  beforeEach(() => localStorage.clear())

  it('returns fresh data and caches it on success', async () => {
    const res = await fetchWithFallback('k', async () => ({ n: 1 }))
    expect(res).toEqual({ data: { n: 1 }, stale: false, ts: expect.any(Number) })
  })

  it('falls back to cached data when the fetcher throws', async () => {
    await fetchWithFallback('k', async () => ({ n: 1 }))
    const res = await fetchWithFallback('k', async () => {
      throw new Error('network down')
    })
    expect(res.data).toEqual({ n: 1 })
    expect(res.stale).toBe(true)
  })

  it('rethrows when the fetcher fails and there is no cache', async () => {
    await expect(
      fetchWithFallback('cold', async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
  })
})
