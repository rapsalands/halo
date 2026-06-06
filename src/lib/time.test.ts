import { describe, it, expect } from 'vitest'
import { formatClock, formatLongDate, timeOfDay } from './time'

describe('formatClock', () => {
  const d = new Date('2026-06-06T14:05:00')
  it('formats 24-hour', () => expect(formatClock(d, false)).toBe('14:05'))
  it('formats 12-hour', () => expect(formatClock(d, true)).toBe('2:05'))
})

describe('formatLongDate', () => {
  it('formats a weekday and month', () => {
    expect(formatLongDate(new Date('2026-06-06T09:00:00'))).toBe('Saturday · June 6')
  })
})

describe('timeOfDay', () => {
  const sunrise = new Date('2026-06-06T05:30:00')
  const sunset = new Date('2026-06-06T19:30:00')
  it('buckets dawn near sunrise', () => {
    expect(timeOfDay(new Date('2026-06-06T05:45:00'), sunrise, sunset)).toBe('dawn')
  })
  it('buckets midday as day', () => {
    expect(timeOfDay(new Date('2026-06-06T12:00:00'), sunrise, sunset)).toBe('day')
  })
  it('buckets dusk near sunset', () => {
    expect(timeOfDay(new Date('2026-06-06T19:15:00'), sunrise, sunset)).toBe('dusk')
  })
  it('buckets deep night', () => {
    expect(timeOfDay(new Date('2026-06-06T23:00:00'), sunrise, sunset)).toBe('night')
  })
})
