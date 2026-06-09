import { describe, it, expect } from 'vitest'
import { aqiCategory } from './aqi'

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
