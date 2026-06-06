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

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })) as unknown as typeof fetch)
    await expect(fetchMarkets(['bitcoin'])).rejects.toThrow()
  })
})
