import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'
import { useSettings } from './store/settings'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    // Avoid real network during the smoke test.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no network in test') }) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('mounts the background and layout without crashing', () => {
    const { container } = render(<App />)
    // The tile grid is the stable mount marker. The particle canvas is not: it
    // only exists for scenes that actually draw particles, and this smoke test
    // has no network, so there is no weather and no such scene.
    expect(container.querySelector('.tile-grid')).toBeInTheDocument()
  })
})
