import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'

// Its own file on purpose: framer-motion reads the reduced-motion query the
// first time any component asks and caches the answer for the module's life,
// so the preference has to be in place before PhotoPanel is ever imported.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

describe('PhotoPanel under reduced motion', () => {
  it('holds the photo still instead of running the perpetual zoom', async () => {
    const { PhotoPanel } = await import('./PhotoPanel')
    const { container } = render(<PhotoPanel />)
    expect(container.querySelector('img')!.style.transform).not.toContain('1.06')
  })
})
