import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkyCompanion } from './SkyCompanion'
import { useAppState, type Weather } from '../store/appState'

const base: Weather = {
  code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], hourly: [], stale: false,
}

describe('SkyCompanion', () => {
  it('shows a celestial body on a clear day', () => {
    useAppState.setState({ weather: base, now: new Date('2026-06-06T12:00:00') })
    const { container } = render(<SkyCompanion />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders nothing in the rain (no sun/moon visible)', () => {
    useAppState.setState({ weather: { ...base, code: 63 }, now: new Date('2026-06-06T12:00:00') })
    const { container } = render(<SkyCompanion />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
