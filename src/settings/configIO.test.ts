import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig, readConfigFromSearch } from './configIO'
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
})
