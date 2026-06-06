import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WeatherIcon } from './WeatherIcon'

describe('WeatherIcon', () => {
  it('renders an svg for a clear-day code', () => {
    const { container } = render(<WeatherIcon code={0} isDay={true} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
  it('renders for rain, snow, and thunder without crashing', () => {
    for (const code of [63, 73, 95]) {
      const { container } = render(<WeatherIcon code={code} isDay={false} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    }
  })
})
