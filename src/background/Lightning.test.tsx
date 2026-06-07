import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Lightning } from './Lightning'

describe('Lightning', () => {
  it('renders flash layers and a bolt', () => {
    const { container } = render(<Lightning />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelectorAll('div').length).toBeGreaterThanOrEqual(2)
  })
})
