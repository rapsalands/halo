import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeatherTile } from './WeatherTile'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const W: Weather = {
  code: 3, isDay: true, temp: 24, feelsLike: 23, humidity: 40, windSpeed: 12,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [
    { date: '2026-06-06', code: 3, tempMax: 27, tempMin: 18, sunrise: '', sunset: '', uvMax: 6 },
    { date: '2026-06-07', code: 0, tempMax: 29, tempMin: 19, sunrise: '', sunset: '', uvMax: 7 },
  ],
  stale: false,
}

describe('WeatherTile', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: W })
  })

  it('shows current temperature in metric with the condition label', () => {
    render(<WeatherTile />)
    expect(screen.getByText('24°')).toBeInTheDocument()
    expect(screen.getByText('Overcast')).toBeInTheDocument()
  })

  it('converts to Fahrenheit in imperial mode', () => {
    useSettings.getState().update({ units: 'imperial' })
    render(<WeatherTile />)
    expect(screen.getByText('75°')).toBeInTheDocument() // 24C → 75F
  })

  it('renders a forecast row per day', () => {
    render(<WeatherTile />)
    expect(screen.getAllByTestId('forecast-day')).toHaveLength(2)
  })

  it('shows a placeholder when weather is missing', () => {
    useAppState.setState({ weather: null })
    render(<WeatherTile />)
    expect(screen.getByText(/weather unavailable/i)).toBeInTheDocument()
  })
})
