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
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })
})
