import { describe, it, expect } from 'vitest'
import { PRESETS, slotsFor } from './presets'

describe('layout presets', () => {
  it('defines the photo-first preset with positioned slots', () => {
    expect(PRESETS['photo-first']).toBeDefined()
    const clock = PRESETS['photo-first'].slots.clock
    expect(clock).toMatchObject({ top: expect.any(String), left: expect.any(String) })
  })

  it('slotsFor returns only enabled tiles that have a slot', () => {
    const slots = slotsFor('photo-first', { clock: true, weather: false, calendar: true, sunmoon: false, quote: false, ticker: false })
    const ids = slots.map((s) => s.id)
    expect(ids).toContain('clock')
    expect(ids).toContain('calendar')
    expect(ids).not.toContain('weather')
  })
})
