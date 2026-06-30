import { describe, it, expect } from 'vitest'
import { formatClock, formatLongDate, timeOfDay, greeting, weekdayShort, zonedYmd } from './time'

describe('formatClock', () => {
  const d = new Date('2026-06-06T14:05:09')
  it('formats 24-hour', () => expect(formatClock(d, false)).toBe('14:05'))
  it('formats 12-hour with meridiem', () => expect(formatClock(d, true)).toBe('2:05 PM'))
  it('shows AM before noon', () => expect(formatClock(new Date('2026-06-06T09:05:00'), true)).toBe('9:05 AM'))
  it('shows 12 AM at midnight', () => expect(formatClock(new Date('2026-06-06T00:30:00'), true)).toBe('12:30 AM'))
  it('appends seconds when requested', () => {
    expect(formatClock(d, false, undefined, true)).toBe('14:05:09')
    expect(formatClock(d, true, undefined, true)).toBe('2:05:09 PM')
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

describe('weekdayShort', () => {
  it('reads a date-only string as a local calendar date, not UTC midnight', () => {
    // 2026-06-06 is a Saturday; component-parsing avoids the off-by-one a bare
    // `new Date("2026-06-06")` (parsed as UTC) causes for hosts west of UTC.
    expect(weekdayShort('2026-06-06')).toBe('Sat')
    expect(weekdayShort('2026-06-07')).toBe('Sun')
  })
})

describe('zonedYmd', () => {
  it('returns host-local Y/M/D when no timezone is given', () => {
    expect(zonedYmd(new Date(2026, 5, 6, 10, 0))).toEqual({ year: 2026, month: 5, day: 6, iso: '2026-06-06' })
  })
  it('rolls the calendar date forward in a zone ahead of UTC', () => {
    // 23:30 UTC is 05:00 the next day in IST (+5:30)
    expect(zonedYmd(new Date('2026-06-06T23:30:00Z'), 'Asia/Kolkata'))
      .toEqual({ year: 2026, month: 5, day: 7, iso: '2026-06-07' })
  })
})
