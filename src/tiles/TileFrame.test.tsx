import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TileFrame } from './TileFrame'

describe('TileFrame', () => {
  it('renders children inside a glass container', () => {
    render(<TileFrame><span>hello</span></TileFrame>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies the accent as a CSS variable', () => {
    const { container } = render(<TileFrame accent="#abcdef">x</TileFrame>)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--accent')).toBe('#abcdef')
  })
})
