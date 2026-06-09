import { describe, it, expect } from 'vitest'
import { formatClock, formatLongDate, timeOfDay, greeting } from './time'

describe('formatClock', () => {
  const d = new Date('2026-06-06T14:05:09')
  it('formats 24-hour', () => expect(formatClock(d, false)).toBe('14:05'))
  it('formats 12-hour', () => expect(formatClock(d, true)).toBe('2:05'))
  it('appends seconds when requested', () => {
    expect(formatClock(d, false, undefined, true)).toBe('14:05:09')
    expect(formatClock(d, true, undefined, true)).toBe('2:05:09')
  })
})

describe('greeting', () => {
  it('buckets the day into greetings', () => {
    expect(greeting(new Date('2026-06-06T08:00:00'))).toBe('Good morning')
    expect(greeting(new Date('2026-06-06T13:00:00'))).toBe('Good afternoon')
    expect(greeting(new Date('2026-06-06T19:00:00'))).toBe('Good evening')
    expect(greeting(new Date('2026-06-06T02:00:00'))).toBe('Good night')
  })
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
