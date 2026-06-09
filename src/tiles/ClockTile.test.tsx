import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClockTile } from './ClockTile'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'

describe('ClockTile', () => {
  beforeEach(() => {
    useAppState.setState({ now: new Date('2026-06-06T14:05:00'), weather: null, location: null })
    useSettings.getState().reset()
  })

  it('shows the 24h time and long date', () => {
    render(<ClockTile />)
    expect(screen.getByText('14:05')).toBeInTheDocument()
    expect(screen.getByText('Saturday · June 6')).toBeInTheDocument()
  })

  it('respects the 12-hour setting', () => {
    useSettings.getState().update({ hour12: true })
    render(<ClockTile />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('renders the clock in the location timezone and shows the place name', () => {
    // 12:00 UTC is 05:00 in Los Angeles (PDT, UTC-7) on this June date.
    useAppState.setState({
      now: new Date('2026-06-06T12:00:00Z'),
      weather: { timezone: 'America/Los_Angeles' } as never,
      location: { lat: 37.773, lon: -122.411, name: 'San Francisco, CA' },
    })
    render(<ClockTile />)
    expect(screen.getByText('05:00')).toBeInTheDocument()
    expect(screen.getByTestId('clock-location')).toHaveTextContent('San Francisco, CA')
  })
})
