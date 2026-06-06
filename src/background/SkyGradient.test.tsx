import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkyGradient } from './SkyGradient'

describe('SkyGradient', () => {
  it('renders a full-screen layer using the palette stops', () => {
    const { container } = render(<SkyGradient sky={['#111111', '#222222']} />)
    const el = container.firstChild as HTMLElement
    // jsdom normalizes hex colors to rgb() in inline styles.
    expect(el.style.background).toContain('linear-gradient')
    expect(el.style.background).toContain('rgb(17, 17, 17)')
    expect(el.style.background).toContain('rgb(34, 34, 34)')
    expect(el.style.position).toBe('absolute')
  })
})
