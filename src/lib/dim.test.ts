import { describe, it, expect } from 'vitest'
import { isDimActive } from './dim'

describe('isDimActive', () => {
  it('handles a window that wraps past midnight', () => {
    expect(isDimActive(23, 23, 6)).toBe(true)
    expect(isDimActive(2, 23, 6)).toBe(true)
    expect(isDimActive(5, 23, 6)).toBe(true)
    expect(isDimActive(6, 23, 6)).toBe(false) // end is exclusive
    expect(isDimActive(12, 23, 6)).toBe(false)
  })
  it('handles a same-day window', () => {
    expect(isDimActive(10, 9, 17)).toBe(true)
    expect(isDimActive(8, 9, 17)).toBe(false)
    expect(isDimActive(17, 9, 17)).toBe(false)
  })
  it('treats a zero-length window as never', () => {
    expect(isDimActive(5, 5, 5)).toBe(false)
  })
})
