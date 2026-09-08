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
  // A dashboard renders up to 13 of these; each perpetual animation holds the
  // compositor at full frame rate, so stillness has to be the default.
  it('is still unless asked to animate', () => {
    const { container } = render(<WeatherIcon code={0} isDay={true} />)
    expect(container.querySelector('.wi-rays')).toBeNull()
  })
  it('animates the sun rays when asked', () => {
    const { container } = render(<WeatherIcon code={0} isDay={true} animated />)
    expect(container.querySelector('.wi-rays')).toBeInTheDocument()
  })
  it('leaves precipitation and bolts still by default', () => {
    for (const [code, sel] of [[63, '.wi-raindrop'], [73, '.wi-snowflake'], [95, '.wi-bolt']] as const) {
      const { container } = render(<WeatherIcon code={code} isDay={true} />)
      expect(container.querySelector(sel)).toBeNull()
    }
  })
  it('animates precipitation and bolts when asked', () => {
    for (const [code, sel] of [[63, '.wi-raindrop'], [73, '.wi-snowflake'], [95, '.wi-bolt']] as const) {
      const { container } = render(<WeatherIcon code={code} isDay={true} animated />)
      expect(container.querySelector(sel)).toBeInTheDocument()
    }
  })
})
