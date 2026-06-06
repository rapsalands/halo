import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SunMoonTile } from './SunMoonTile'
import { useAppState, type Weather } from '../store/appState'

const W: Weather = {
  code: 0, isDay: true, temp: 22, feelsLike: 22, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [{ date: '2026-06-06', code: 0, tempMax: 27, tempMin: 18, sunrise: '2026-06-06T05:30', sunset: '2026-06-06T19:30', uvMax: 6 }],
  stale: false,
}

describe('SunMoonTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ weather: W, now: new Date('2026-06-06T12:00:00'), location: { lat: 1, lon: 2, name: 'x' } })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ current: { us_aqi: 42, pm2_5: 9 } }) })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows sunrise and sunset times', () => {
    render(<SunMoonTile />)
    expect(screen.getByText('05:30')).toBeInTheDocument()
    expect(screen.getByText('19:30')).toBeInTheDocument()
  })

  it('shows a moon phase name and UV', () => {
    render(<SunMoonTile />)
    expect(screen.getByTestId('moon-name')).toBeInTheDocument()
    expect(screen.getByText('UV')).toBeInTheDocument()
  })

  it('renders a placeholder when weather is missing', () => {
    useAppState.setState({ weather: null })
    render(<SunMoonTile />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
