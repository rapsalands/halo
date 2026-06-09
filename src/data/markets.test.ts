import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMarkets } from './markets'

afterEach(() => vi.restoreAllMocks())

describe('fetchMarkets', () => {
  it('maps CoinGecko simple/price payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 65000, usd_24h_change: 1.5 },
        ethereum: { usd: 3200, usd_24h_change: -2.1 },
      }),
    })) as unknown as typeof fetch)
    const coins = await fetchMarkets(['bitcoin', 'ethereum'])
    expect(coins).toEqual([
      { id: 'bitcoin', symbol: 'BTC', price: 65000, change24h: 1.5 },
      { id: 'ethereum', symbol: 'ETH', price: 3200, change24h: -2.1 },
    ])
  })

  it('prices in the requested currency', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ bitcoin: { inr: 5400000, inr_24h_change: 0.8 } }),
    }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
    const coins = await fetchMarkets(['bitcoin'], 'inr')
    expect(coins[0]).toEqual({ id: 'bitcoin', symbol: 'BTC', price: 5400000, change24h: 0.8 })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('vs_currencies=inr'))
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })) as unknown as typeof fetch)
    await expect(fetchMarkets(['bitcoin'])).rejects.toThrow()
  })
})
