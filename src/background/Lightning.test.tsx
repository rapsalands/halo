import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Lightning } from './Lightning'

describe('Lightning', () => {
  it('renders flash layers and a bolt', () => {
    const { container } = render(<Lightning />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelectorAll('div').length).toBeGreaterThanOrEqual(2)
  })
  // The layers are full-screen and run perpetually; a class is what the
  // reduced-motion media query can switch off, an inline style is not.
  it('classes every perpetual layer so reduced motion can still them', () => {
    const { container } = render(<Lightning />)
    for (const sel of ['.halo-flash-a', '.halo-flash-b', '.halo-bolt']) {
      expect(container.querySelector(sel)).toBeInTheDocument()
    }
  })
})
