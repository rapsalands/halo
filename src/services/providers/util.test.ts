import { describe, it, expect } from 'vitest'
import { fallbackWeather, fallbackAir } from './util'
import type { WeatherProvider, AirQualityProvider } from './types'

const loc = { lat: 1, lon: 2, name: 'x' }
const okW = (id: string, temp: number): WeatherProvider => ({ id, fetchWeather: async () => ({ temp } as never) })
const failW = (id: string): WeatherProvider => ({ id, fetchWeather: async () => { throw new Error('down') } })

describe('fallbackWeather', () => {
  it('uses the first provider that succeeds', async () => {
    const p = fallbackWeather(failW('a'), okW('b', 21), okW('c', 99))
    expect(p.id).toBe('a+b+c')
    expect((await p.fetchWeather(loc)).temp).toBe(21)
  })

  it('throws the last error if all fail', async () => {
    await expect(fallbackWeather(failW('a'), failW('b')).fetchWeather(loc)).rejects.toThrow('down')
  })
})

describe('fallbackAir', () => {
  it('falls through to the next provider on error', async () => {
    const bad: AirQualityProvider = { id: 'bad', fetchAirQuality: async () => { throw new Error('x') } }
    const good: AirQualityProvider = { id: 'good', fetchAirQuality: async () => ({ usAqi: 42, pm25: 9 }) }
    const aq = await fallbackAir(bad, good).fetchAirQuality(loc)
    expect(aq).toEqual({ usAqi: 42, pm25: 9 })
  })
})
