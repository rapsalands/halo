import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'

// Its own file: framer-motion reads the reduced-motion query once, the first
// time any component asks, so the preference must precede the import.
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

describe('ParticleCanvas under reduced motion', () => {
  it('draws nothing even for a scene that would have particles', async () => {
    const { ParticleCanvas } = await import('./ParticleCanvas')
    const { container } = render(<ParticleCanvas scene="rain" performance="high" />)
    expect(container.querySelector('canvas')).toBeNull()
  })
})
