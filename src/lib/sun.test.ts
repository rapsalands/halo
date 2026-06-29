import { describe, it, expect } from 'vitest'
import { moonPhase, isDaytime, sunTimes } from './sun'

describe('sunTimes', () => {
  const hours = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 3_600_000

  it('gives ~12h of daylight at the equator on an equinox', () => {
    const { sunrise, sunset } = sunTimes(new Date('2026-03-20T12:00:00Z'), 0, 0)
    expect(sunrise).not.toBeNull()
    expect(hours(sunrise!, sunset!)).toBeCloseTo(12, 0)
    expect(sunrise!.getTime()).toBeLessThan(sunset!.getTime())
  })

  it('gives a long (~15h) day in New York at the summer solstice', () => {
    const { sunrise, sunset } = sunTimes(new Date('2026-06-21T12:00:00Z'), 40.71, -74.01)
    expect(hours(sunrise!, sunset!)).toBeGreaterThan(14.5)
    expect(hours(sunrise!, sunset!)).toBeLessThan(15.5)
  })

  it('returns nulls during polar day', () => {
    const { sunrise, sunset } = sunTimes(new Date('2026-06-21T12:00:00Z'), 80, 0)
    expect(sunrise).toBeNull()
    expect(sunset).toBeNull()
  })
})

describe('moonPhase', () => {
  it('identifies a known new moon (2025-12-20) by name bucket', () => {
    const p = moonPhase(new Date('2025-12-20T00:00:00Z'))
    expect(p.fraction).toBeGreaterThanOrEqual(0)
    expect(p.fraction).toBeLessThan(1)
    expect(['New Moon', 'Waning Crescent', 'Waxing Crescent']).toContain(p.name)
  })

  it('identifies a full moon around 2026-01-03', () => {
    const p = moonPhase(new Date('2026-01-03T12:00:00Z'))
    expect(p.name).toBe('Full Moon')
    expect(p.illumination).toBeGreaterThan(0.9)
  })

  it('returns illumination between 0 and 1', () => {
    const p = moonPhase(new Date('2026-06-06T00:00:00Z'))
    expect(p.illumination).toBeGreaterThanOrEqual(0)
    expect(p.illumination).toBeLessThanOrEqual(1)
  })
})

describe('isDaytime', () => {
  it('is true between sunrise and sunset', () => {
    const sunrise = new Date('2026-06-06T05:30:00Z')
    const sunset = new Date('2026-06-06T19:30:00Z')
    expect(isDaytime(new Date('2026-06-06T12:00:00Z'), sunrise, sunset)).toBe(true)
    expect(isDaytime(new Date('2026-06-06T22:00:00Z'), sunrise, sunset)).toBe(false)
    expect(isDaytime(new Date('2026-06-06T03:00:00Z'), sunrise, sunset)).toBe(false)
  })
})
