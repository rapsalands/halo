import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CalendarTile } from './CalendarTile'
import { useAppState } from '../store/appState'

describe('CalendarTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ now: new Date(2026, 5, 6) }) // June 6 2026
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{ date: '2026-06-06', localName: 'Test Day', name: 'Test Day' }],
    })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders the current month name and 42 day cells', () => {
    render(<CalendarTile />)
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('cal-cell')).toHaveLength(42)
  })

  it('marks a holiday cell once holidays load', async () => {
    render(<CalendarTile />)
    await waitFor(() => expect(screen.getByTestId('cal-holiday')).toBeInTheDocument())
  })
})
