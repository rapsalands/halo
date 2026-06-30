import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig, readConfigFromSearch, readLocationFromSearch } from './configIO'
import { DEFAULT_SETTINGS } from '../store/defaults'

describe('configIO', () => {
  it('round-trips settings through encode/decode', () => {
    const enc = encodeConfig({ ...DEFAULT_SETTINGS, units: 'imperial', hour12: true })
    const dec = decodeConfig(enc)
    expect(dec?.units).toBe('imperial')
    expect(dec?.hour12).toBe(true)
  })

  it('returns null for garbage input', () => {
    expect(decodeConfig('!!!not-base64!!!')).toBeNull()
  })

  it('reads a config query param', () => {
    const enc = encodeConfig({ ...DEFAULT_SETTINGS, performance: 'low' })
    const got = readConfigFromSearch(`?config=${encodeURIComponent(enc)}`)
    expect(got?.performance).toBe('low')
  })

  it('returns null when there is no config param', () => {
    expect(readConfigFromSearch('?foo=bar')).toBeNull()
  })

  it('reads an explicit lat/lon/place location param', () => {
    const got = readLocationFromSearch('?lat=37.77299&lon=-122.41136&place=San+Francisco%2C+CA')
    expect(got?.location).toEqual({ lat: 37.77299, lon: -122.41136, name: 'San Francisco, CA' })
  })

  it('defaults the place label when omitted', () => {
    expect(readLocationFromSearch('?lat=40.7&lon=-74')?.location?.name).toBe('Configured location')
  })

  it('returns null without finite lat/lon', () => {
    expect(readLocationFromSearch('?place=Nowhere')).toBeNull()
    expect(readLocationFromSearch('?lat=abc&lon=2')).toBeNull()
    expect(readLocationFromSearch('?foo=bar')).toBeNull()
  })

  // --- S1/S2: imported config is sanitized, not trusted verbatim ---
  const encodeRaw = (obj: unknown) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))

  it('strips an unsafe accent from an imported config (no CSS injection)', () => {
    const blob = encodeRaw({ accent: 'url(https://evil.example/ping)', hour12: true })
    expect(decodeConfig(blob)).toEqual({ hour12: true })
  })

  it('drops unknown keys from an imported config', () => {
    const blob = encodeRaw({ evil: 1, units: 'imperial' })
    expect(decodeConfig(blob)).toEqual({ units: 'imperial' })
  })

  it('drops a non-array tileLayout that would otherwise crash the grid', () => {
    const blob = encodeRaw({ tileLayout: 'garbage', hour12: true })
    expect(decodeConfig(blob)).toEqual({ hour12: true })
  })

  // --- S3: location query params are range/length checked ---
  it('rejects out-of-range coordinates', () => {
    expect(readLocationFromSearch('?lat=200&lon=0')).toBeNull()
    expect(readLocationFromSearch('?lat=0&lon=999')).toBeNull()
    expect(readLocationFromSearch('?lat=-91&lon=0')).toBeNull()
  })

  it('caps an overly long place label', () => {
    const long = 'x'.repeat(500)
    const name = readLocationFromSearch(`?lat=1&lon=2&place=${long}`)?.location?.name ?? ''
    expect(name.length).toBeLessThanOrEqual(60)
  })
})
