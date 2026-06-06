import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaleBadge } from './StaleBadge'
import { useAppState, type Weather } from '../store/appState'

const W = (stale: boolean): Weather => ({
  code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], stale,
})

describe('StaleBadge', () => {
  beforeEach(() => useAppState.setState({ weather: null }))

  it('renders nothing when data is fresh', () => {
    useAppState.setState({ weather: W(false) })
    const { container } = render(<StaleBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('warns when weather data is stale', () => {
    useAppState.setState({ weather: W(true) })
    render(<StaleBadge />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })
})
