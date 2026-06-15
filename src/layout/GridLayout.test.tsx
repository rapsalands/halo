import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { GridLayout } from './GridLayout'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

function region(c: HTMLElement, id: string): HTMLElement | null {
  return c.querySelector(`[data-region="${id}"]`)
}

describe('GridLayout', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00') })
  })

  it('places the clock and photo panel so their column edges meet at line 8', () => {
    const { container } = render(<GridLayout />)
    expect(region(container, 'clock')!.getAttribute('data-col')).toBe('1 / 8')
    expect(region(container, 'photo')!.getAttribute('data-col')).toBe('8 / 13')
  })

  it('aligns the left-column regions to the same right edge (line 8)', () => {
    const { container } = render(<GridLayout />)
    for (const id of ['clock', 'air', 'sunmoon', 'forecast']) {
      expect(region(container, id)!.getAttribute('data-col')!.endsWith('/ 8')).toBe(true)
    }
  })

  it('always renders the photo panel and omits disabled tiles', () => {
    useSettings.getState().update({
      enabledTiles: { clock: true, weather: false, calendar: true, sunmoon: true, quote: true, ticker: true, air: true },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'photo')).toBeInTheDocument()
    expect(region(container, 'weather')).toBeNull()
    expect(region(container, 'forecast')).toBeNull() // forecast follows the weather toggle
  })
})
