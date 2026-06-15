import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WeatherEffectsOverlay } from './WeatherEffectsOverlay'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const base: Weather = {
  code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], hourly: [], stale: false,
}

describe('WeatherEffectsOverlay', () => {
  beforeEach(() => { useSettings.getState().reset() })

  it('always renders a particle canvas', () => {
    useAppState.setState({ weather: base, now: new Date('2026-06-06T12:00:00') })
    const { container } = render(<WeatherEffectsOverlay />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders a lightning bolt only for the thunder scene', () => {
    useAppState.setState({ weather: { ...base, code: 95 }, now: new Date('2026-06-06T12:00:00') })
    const thunder = render(<WeatherEffectsOverlay />)
    expect(thunder.container.querySelector('svg polygon')).toBeInTheDocument()

    useAppState.setState({ weather: base, now: new Date('2026-06-06T12:00:00') })
    const clear = render(<WeatherEffectsOverlay />)
    expect(clear.container.querySelector('svg polygon')).toBeNull()
  })
})
