import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteTile } from './QuoteTile'
import { useAppState } from '../store/appState'
import { pickDailyQuote } from '../lib/quotes'

describe('QuoteTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ now: new Date(2026, 5, 6) })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ events: [] }) })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the deterministic daily quote and author', () => {
    const q = pickDailyQuote(new Date(2026, 5, 6))
    render(<QuoteTile />)
    expect(screen.getByText(new RegExp(q.author))).toBeInTheDocument()
  })
})
