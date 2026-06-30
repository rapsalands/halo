import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TickerTile } from './TickerTile'

describe('TickerTile', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ bitcoin: { usd: 65000, usd_24h_change: 1.5 } }),
    })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders coin symbols once data loads', async () => {
    render(<TickerTile />)
    // Symbol is derived from the first 4 chars of the CoinGecko id (no symbol map).
    await waitFor(() => expect(screen.getByText(/BITC/)).toBeInTheDocument())
  })

  it('shows a placeholder instead of crashing when a coin has no price', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ bitcoin: { usd_24h_change: 1.5 } }), // present, but no usd price
    })) as unknown as typeof fetch)
    render(<TickerTile />)
    await waitFor(() => expect(screen.getByText(/BITC/)).toBeInTheDocument())
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
