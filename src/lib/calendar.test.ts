import { describe, it, expect } from 'vitest'
import { buildMonthGrid, isoOf } from './calendar'

describe('buildMonthGrid', () => {
  it('returns 42 cells (6 weeks, Sunday-first)', () => {
    expect(buildMonthGrid(2026, 5)).toHaveLength(42) // June 2026
  })
  it('marks exactly the days in the target month', () => {
    const inMonth = buildMonthGrid(2026, 5).filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(30) // June has 30 days
    expect(inMonth[0].day).toBe(1)
    expect(inMonth[29].day).toBe(30)
  })
  it('emits ISO dates', () => {
    const cells = buildMonthGrid(2026, 5)
    const june1 = cells.find((c) => c.inMonth && c.day === 1)!
    expect(june1.iso).toBe('2026-06-01')
  })
})

describe('isoOf', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(isoOf(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})
