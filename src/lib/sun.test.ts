import { describe, it, expect } from 'vitest'
import { moonPhase, isDaytime } from './sun'

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
