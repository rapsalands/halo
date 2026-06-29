import { describe, it, expect } from 'vitest'
import { weatherProviderFor } from './weather'
import { airProviderFor } from './airQuality'

const loc = (countryCode?: string) => ({ lat: 1, lon: 2, name: 'x', countryCode })

describe('provider selection', () => {
  it('routes US weather to NWS and other countries to the default', () => {
    expect(weatherProviderFor(loc('US')).id).toBe('nws')
    expect(weatherProviderFor(loc()).id).toBe('open-meteo')
    expect(weatherProviderFor(loc('FR')).id).toBe('open-meteo')
  })

  it('uses the default air-quality provider until a country one is registered', () => {
    expect(airProviderFor(loc('US')).id).toBe('open-meteo')
    expect(airProviderFor(loc('IN')).id).toBe('open-meteo')
  })
})
