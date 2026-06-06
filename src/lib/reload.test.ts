import { describe, it, expect } from 'vitest'
import { msUntilNextReload } from './reload'

describe('msUntilNextReload', () => {
  it('targets later today when the hour has not passed', () => {
    const now = new Date(2026, 5, 6, 1, 0, 0) // 01:00
    expect(msUntilNextReload(now, 3)).toBe(2 * 60 * 60_000) // 2h to 03:00
  })
  it('targets tomorrow when the hour has passed', () => {
    const now = new Date(2026, 5, 6, 4, 0, 0) // 04:00
    expect(msUntilNextReload(now, 3)).toBe(23 * 60 * 60_000) // 23h to 03:00 next day
  })
})
