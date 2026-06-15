import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastTile } from './ForecastTile'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const W: Weather = {
  code: 3, isDay: true, temp: 24, feelsLike: 23, humidity: 40, windSpeed: 12,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [
    { date: '2026-06-06', code: 3, tempMax: 27, tempMin: 18, sunrise: '', sunset: '', uvMax: 6 },
    { date: '2026-06-07', code: 0, tempMax: 29, tempMin: 19, sunrise: '', sunset: '', uvMax: 7 },
  ],
  hourly: [], stale: false,
}

describe('ForecastTile', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: W })
  })

  it('renders one column per forecast day', () => {
    render(<ForecastTile />)
    expect(screen.getAllByTestId('forecast-day')).toHaveLength(2)
  })

  it('converts highs to Fahrenheit in imperial mode', () => {
    useSettings.getState().update({ units: 'imperial' })
    render(<ForecastTile />)
    expect(screen.getByText('81°')).toBeInTheDocument() // 27C → 81F
  })

  it('renders nothing when there is no weather', () => {
    useAppState.setState({ weather: null })
    const { container } = render(<ForecastTile />)
    expect(container.querySelector('[data-testid="forecast-day"]')).toBeNull()
  })
})
