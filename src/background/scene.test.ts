import { describe, it, expect } from 'vitest'
import { selectScene } from './scene'
import type { Weather } from '../store/appState'

function weather(over: Partial<Weather>): Weather {
  return {
    code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
    sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
    daily: [], stale: false, ...over,
  }
}

describe('selectScene', () => {
  it('returns clear-day for clear daytime weather', () => {
    const s = selectScene(weather({ code: 0, isDay: true }), new Date('2026-06-06T12:00:00'))
    expect(s.scene).toBe('clear-day')
    expect(s.dayPart).toBe('day')
    expect(s.palette.accent).toMatch(/^#|rgb/)
  })

  it('returns rain scene with cool accent', () => {
    const s = selectScene(weather({ code: 63 }), new Date('2026-06-06T12:00:00'))
    expect(s.scene).toBe('rain')
  })

  it('returns clear-night when isDay false', () => {
    const s = selectScene(weather({ code: 0, isDay: false }), new Date('2026-06-06T23:00:00'))
    expect(s.scene).toBe('clear-night')
    expect(s.dayPart).toBe('night')
  })

  it('warms the accent at dusk', () => {
    const s = selectScene(weather({ code: 0 }), new Date('2026-06-06T19:15:00'))
    expect(s.dayPart).toBe('dusk')
  })
})
