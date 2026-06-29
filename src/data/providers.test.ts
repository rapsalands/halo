import { describe, it, expect } from 'vitest'
import { weatherProviderFor } from './weather'
import { airProviderFor } from './airQuality'

const loc = (countryCode?: string) => ({ lat: 1, lon: 2, name: 'x', countryCode })

describe('provider selection', () => {
  it('uses the default (open-meteo) provider when no country override exists', () => {
    expect(weatherProviderFor(loc()).id).toBe('open-meteo')
    expect(weatherProviderFor(loc('US')).id).toBe('open-meteo') // none registered yet
    expect(airProviderFor(loc('IN')).id).toBe('open-meteo')
  })
})
