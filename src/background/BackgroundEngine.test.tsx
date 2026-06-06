import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BackgroundEngine } from './BackgroundEngine'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const clearDay: Weather = {
  code: 0, isDay: true, temp: 22, feelsLike: 22, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], hourly: [], stale: false,
}

describe('BackgroundEngine', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: clearDay, now: new Date('2026-06-06T12:00:00') })
  })

  it('renders a sky layer and a canvas', () => {
    const { container } = render(<BackgroundEngine />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders nothing-breaking when weather is null', () => {
    useAppState.setState({ weather: null })
    expect(() => render(<BackgroundEngine />)).not.toThrow()
  })
})
