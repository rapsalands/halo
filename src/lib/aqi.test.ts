import { describe, it, expect } from 'vitest'
import { aqiCategory, aqiFromPm25, pm25FromAqi } from './aqi'

describe('aqiCategory', () => {
  it('buckets US-AQI values into EPA bands', () => {
    expect(aqiCategory(20).label).toBe('Good')
    expect(aqiCategory(75).label).toBe('Moderate')
    expect(aqiCategory(120).label).toBe('Sensitive')
    expect(aqiCategory(180).label).toBe('Unhealthy')
    expect(aqiCategory(250).label).toBe('Very unhealthy')
    expect(aqiCategory(400).label).toBe('Hazardous')
  })
  it('returns a color for each band', () => {
    expect(aqiCategory(20).color).toMatch(/^#/)
  })
})

describe('aqiFromPm25 / pm25FromAqi', () => {
  it('maps PM2.5 concentration to US AQI via EPA breakpoints', () => {
    expect(aqiFromPm25(0)).toBe(0)
    expect(aqiFromPm25(12)).toBe(50) // top of Good
    expect(aqiFromPm25(35.4)).toBe(100) // top of Moderate
    expect(aqiFromPm25(55.4)).toBe(150)
    expect(aqiFromPm25(9999)).toBe(500)
  })

  it('round-trips approximately through the inverse', () => {
    for (const c of [9, 20, 40, 120]) {
      expect(Math.abs(pm25FromAqi(aqiFromPm25(c)) - c)).toBeLessThan(1)
    }
  })
})
