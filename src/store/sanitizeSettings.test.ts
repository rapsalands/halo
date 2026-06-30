import { describe, it, expect } from 'vitest'
import { sanitizeSettings } from './sanitizeSettings'
import { DEFAULT_SETTINGS, ACCENT_SWATCHES, DEFAULT_LAYOUT } from './defaults'

describe('sanitizeSettings', () => {
  it('returns an empty object for non-object input', () => {
    expect(sanitizeSettings(null)).toEqual({})
    expect(sanitizeSettings(undefined)).toEqual({})
    expect(sanitizeSettings('settings')).toEqual({})
    expect(sanitizeSettings(42)).toEqual({})
    // arrays are objects but are not a valid settings shape
    expect(sanitizeSettings(['a', 'b'])).toEqual({})
  })

  it('drops unknown keys', () => {
    expect(sanitizeSettings({ foo: 1, bar: 'x', hour12: true })).toEqual({ hour12: true })
  })

  it('round-trips a full valid settings object unchanged in shape', () => {
    const clean = sanitizeSettings({ ...DEFAULT_SETTINGS })
    expect(clean).toEqual(DEFAULT_SETTINGS)
  })

  it('drops wrong-typed scalar fields', () => {
    expect(sanitizeSettings({ hour12: 'yes' })).toEqual({})
    expect(sanitizeSettings({ showSeconds: 1 })).toEqual({})
    expect(sanitizeSettings({ greetingName: 5 })).toEqual({})
  })

  it('validates enum fields', () => {
    expect(sanitizeSettings({ units: 'imperial' })).toEqual({ units: 'imperial' })
    expect(sanitizeSettings({ units: 'banana' })).toEqual({})
    expect(sanitizeSettings({ performance: 'low' })).toEqual({ performance: 'low' })
    expect(sanitizeSettings({ performance: 'turbo' })).toEqual({})
    expect(sanitizeSettings({ preview: 'thunder' })).toEqual({ preview: 'thunder' })
    expect(sanitizeSettings({ preview: 'apocalypse' })).toEqual({})
  })

  it('caps greetingName length', () => {
    const long = 'x'.repeat(200)
    const out = sanitizeSettings({ greetingName: long })
    expect((out.greetingName ?? '').length).toBeLessThanOrEqual(24)
  })

  // --- S2: accent must never be an arbitrary CSS value ---
  it('only accepts a hex/swatch accent and rejects CSS injection', () => {
    expect(sanitizeSettings({ accent: ACCENT_SWATCHES[0] })).toEqual({ accent: ACCENT_SWATCHES[0] })
    expect(sanitizeSettings({ accent: '#ff0000' })).toEqual({ accent: '#ff0000' })
    expect(sanitizeSettings({ accent: '#FFF' })).toEqual({ accent: '#FFF' })
    // the attack: a url() that would phone home via background: var(--accent)
    expect(sanitizeSettings({ accent: 'url(https://evil.example/ping)' })).toEqual({})
    expect(sanitizeSettings({ accent: 'red' })).toEqual({})
    expect(sanitizeSettings({ accent: '#ff0000; background: url(x)' })).toEqual({})
  })

  it('validates integer-range fields (dim hours)', () => {
    expect(sanitizeSettings({ dimStart: 23, dimEnd: 6 })).toEqual({ dimStart: 23, dimEnd: 6 })
    expect(sanitizeSettings({ dimStart: 24 })).toEqual({})
    expect(sanitizeSettings({ dimStart: -1 })).toEqual({})
    expect(sanitizeSettings({ dimStart: 5.5 })).toEqual({})
    expect(sanitizeSettings({ dimStart: '5' })).toEqual({})
  })

  // --- S1: the brick vectors ---
  it('drops a non-array tileLayout (the brick vector)', () => {
    expect(sanitizeSettings({ tileLayout: 'garbage' })).toEqual({})
    expect(sanitizeSettings({ tileLayout: 42 })).toEqual({})
    expect(sanitizeSettings({ tileLayout: { i: 'clock' } })).toEqual({})
  })

  it('keeps a valid tileLayout and filters out malformed items', () => {
    expect(sanitizeSettings({ tileLayout: DEFAULT_LAYOUT }).tileLayout).toEqual(DEFAULT_LAYOUT)
    const mixed = sanitizeSettings({
      tileLayout: [
        { i: 'clock', x: 0, y: 0, w: 7, h: 2 },
        { i: 'bogus-region', x: 0, y: 0, w: 1, h: 1 },
        { i: 'weather', x: 'x', y: 0, w: 1, h: 1 },
      ],
    })
    expect(mixed.tileLayout).toEqual([{ i: 'clock', x: 0, y: 0, w: 7, h: 2 }])
  })

  it('keeps only boolean entries for known tiles in enabledTiles', () => {
    expect(sanitizeSettings({ enabledTiles: 'all' })).toEqual({})
    const out = sanitizeSettings({ enabledTiles: { clock: true, weather: false, bogus: true, air: 'yes' } })
    expect(out.enabledTiles).toEqual({ clock: true, weather: false })
  })

  it('validates location range and shape, and keeps null', () => {
    expect(sanitizeSettings({ location: null })).toEqual({ location: null })
    expect(sanitizeSettings({ location: { lat: 37.7, lon: -122.4, name: 'SF' } }))
      .toEqual({ location: { lat: 37.7, lon: -122.4, name: 'SF' } })
    // out of range → dropped entirely
    expect(sanitizeSettings({ location: { lat: 200, lon: 0, name: 'x' } })).toEqual({})
    expect(sanitizeSettings({ location: { lat: 0, lon: 999, name: 'x' } })).toEqual({})
    expect(sanitizeSettings({ location: { lat: 'x', lon: 0, name: 'x' } })).toEqual({})
  })

  it('validates tickerCoins as a list of slug strings', () => {
    expect(sanitizeSettings({ tickerCoins: 'bitcoin' })).toEqual({})
    expect(sanitizeSettings({ tickerCoins: ['bitcoin', 'ethereum'] }))
      .toEqual({ tickerCoins: ['bitcoin', 'ethereum'] })
    const filtered = sanitizeSettings({ tickerCoins: ['ok-coin', 'bad coin!', 42, ''] })
    expect(filtered.tickerCoins).toEqual(['ok-coin'])
  })

  it('does not preserve a __proto__ key as own settings data', () => {
    const out = sanitizeSettings(JSON.parse('{"__proto__":{"polluted":true},"hour12":true}'))
    expect(out).toEqual({ hour12: true })
    expect(Object.prototype.hasOwnProperty.call(out, '__proto__')).toBe(false)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
