import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GridLayout } from './GridLayout'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

function region(c: HTMLElement, id: string): HTMLElement | null {
  return c.querySelector(`[data-region="${id}"]`)
}
function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

describe('GridLayout', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00'), editMode: false })
    setOnline(true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders every enabled tile', () => {
    const { container } = render(<GridLayout />)
    for (const id of ['clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'forecast', 'photo', 'ticker']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })

  it('omits a disabled tile', () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, weather: false },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'weather')).toBeNull()
  })

  it('shows forecast independently of the weather tile', () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, weather: false, forecast: true },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'weather')).toBeNull()
    expect(region(container, 'forecast')).toBeInTheDocument()
  })

  it('shows remove buttons and the tray only in edit mode', () => {
    const { container, rerender } = render(<GridLayout />)
    expect(container.querySelectorAll('.tile-shell__remove')).toHaveLength(0)
    expect(container.querySelector('[data-testid="tile-tray"]')).toBeNull()

    useAppState.setState({ editMode: true })
    rerender(<GridLayout />)
    expect(container.querySelectorAll('.tile-shell__remove').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-testid="tile-tray"]')).toBeInTheDocument()
  })
})

describe('GridLayout offline gating', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00'), editMode: false })
  })
  afterEach(() => vi.restoreAllMocks())

  it('hides internet-dependent tiles when offline, keeps offline-capable ones', () => {
    setOnline(false)
    const { container } = render(<GridLayout />)
    for (const id of ['weather', 'air', 'forecast', 'photo', 'ticker', 'sunmoon']) {
      expect(region(container, id)).toBeNull()
    }
    for (const id of ['clock', 'calendar', 'quote']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })

  it('shows the internet-dependent tiles when online', () => {
    setOnline(true)
    const { container } = render(<GridLayout />)
    for (const id of ['weather', 'air', 'forecast', 'photo', 'ticker', 'sunmoon']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })
})
