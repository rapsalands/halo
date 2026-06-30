import { describe, it, expect } from 'vitest'
import { getWeatherProvider } from './weatherService'
import { getAirQualityProvider } from './airQualityService'

const loc = (countryCode?: string) => ({ lat: 1, lon: 2, name: 'x', countryCode })

describe('provider selection', () => {
  it('routes weather by country, falling back to OpenWeather', () => {
    expect(getWeatherProvider(loc('US')).id).toBe('nws+openweather') // NWS, then OW
    expect(getWeatherProvider(loc('IN')).id).toBe('openweather') // India weather via fallback
    expect(getWeatherProvider(loc('FR')).id).toBe('openweather')
    expect(getWeatherProvider(loc()).id).toBe('openweather')
  })

  it('routes air quality by country, falling back to OpenWeather', () => {
    expect(getAirQualityProvider(loc('US')).id).toBe('airnow')
    expect(getAirQualityProvider(loc('IN')).id).toBe('cpcb')
    expect(getAirQualityProvider(loc('FR')).id).toBe('openweather')
  })
})
