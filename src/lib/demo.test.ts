import { describe, it, expect } from 'vitest'
import { parseDemoName, overrideFor, applyDemo, synthDemoWeather } from './demo'
import type { Weather } from '../store/appState'

const base: Weather = {
  code: 3, isDay: true, temp: 12, feelsLike: 11, humidity: 80, windSpeed: 6,
  sunriseToday: '2026-06-07T06:00', sunsetToday: '2026-06-07T19:00',
  daily: [{ date: '2026-06-07', code: 3, tempMax: 15, tempMin: 9, sunrise: '', sunset: '', uvMax: 4 }],
  hourly: [{ time: '2026-06-07T10:00', temp: 12, code: 3 }],
  stale: false,
}

describe('parseDemoName', () => {
  it('maps a known preset name', () => {
    expect(parseDemoName('?demo=rain')).toBe('rain')
    expect(parseDemoName('?demo=NIGHT')).toBe('night')
  })
  it('returns null for unknown or missing', () => {
    expect(parseDemoName('?demo=banana')).toBeNull()
    expect(parseDemoName('?x=1')).toBeNull()
  })
})

describe('overrideFor', () => {
  it('returns null for live and an override for a preset', () => {
    expect(overrideFor('live')).toBeNull()
    expect(overrideFor('thunder')).toEqual({ code: 95, isDay: true })
  })
})

describe('applyDemo', () => {
  it('forces the code on current, daily and hourly while keeping temps', () => {
    const w = applyDemo(base, { code: 63, isDay: true })
    expect(w.code).toBe(63)
    expect(w.temp).toBe(12) // real temp preserved
    expect(w.daily[0].code).toBe(63)
    expect(w.hourly[0].code).toBe(63)
  })
})

describe('synthDemoWeather', () => {
  it('builds a complete weather object', () => {
    const w = synthDemoWeather({ code: 95, isDay: true }, new Date(2026, 5, 7, 10, 0))
    expect(w.code).toBe(95)
    expect(w.daily.length).toBeGreaterThan(0)
    expect(w.hourly.length).toBeGreaterThan(0)
  })
})
