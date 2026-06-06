import { describe, it, expect } from 'vitest'
import { pickDailyQuote, QUOTES } from './quotes'

describe('pickDailyQuote', () => {
  it('is deterministic for a given date', () => {
    const a = pickDailyQuote(new Date(2026, 5, 6))
    const b = pickDailyQuote(new Date(2026, 5, 6))
    expect(a).toEqual(b)
  })
  it('returns an entry from the bundled list', () => {
    expect(QUOTES).toContainEqual(pickDailyQuote(new Date(2026, 0, 1)))
  })
  it('varies across the year', () => {
    const set = new Set(Array.from({ length: 30 }, (_, i) => pickDailyQuote(new Date(2026, 0, 1 + i)).text))
    expect(set.size).toBeGreaterThan(1)
  })
})
