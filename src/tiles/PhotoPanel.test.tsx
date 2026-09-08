import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PhotoPanel } from './PhotoPanel'

describe('PhotoPanel', () => {
  it('renders an opaque cover image filling the panel', () => {
    const { container } = render(<PhotoPanel />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img!.style.objectFit).toBe('cover')
  })
  // The other half of the contract lives in PhotoPanel.reducedMotion.test.tsx.
  it('runs the Ken-Burns zoom when motion is welcome', () => {
    const { container } = render(<PhotoPanel />)
    expect(container.querySelector('img')!.style.transform).toContain('1.06')
  })
})
