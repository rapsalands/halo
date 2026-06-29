import { describe, it, expect } from 'vitest'
import { weatherProviderFor } from './weatherService'
import { airProviderFor } from './airQualityService'

const loc = (countryCode?: string) => ({ lat: 1, lon: 2, name: 'x', countryCode })

describe('provider selection', () => {
  it('routes weather by country, falling back to OpenWeather', () => {
    expect(weatherProviderFor(loc('US')).id).toBe('nws+openweather') // NWS, then OW
    expect(weatherProviderFor(loc('IN')).id).toBe('openweather') // India weather via fallback
    expect(weatherProviderFor(loc('FR')).id).toBe('openweather')
    expect(weatherProviderFor(loc()).id).toBe('openweather')
  })

  it('routes air quality by country, falling back to OpenWeather', () => {
    expect(airProviderFor(loc('US')).id).toBe('airnow')
    expect(airProviderFor(loc('IN')).id).toBe('cpcb')
    expect(airProviderFor(loc('FR')).id).toBe('openweather')
  })
})
