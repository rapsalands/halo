import { describe, it, expect, beforeEach } from 'vitest'
import { useSettings } from './settings'
import { DEFAULT_SETTINGS, DEFAULT_LAYOUT, LAYOUT_VERSION } from './defaults'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
  })

  it('starts from defaults', () => {
    expect(useSettings.getState().settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updates and persists a setting', () => {
    useSettings.getState().update({ units: 'imperial' })
    expect(useSettings.getState().settings.units).toBe('imperial')
    const raw = JSON.parse(localStorage.getItem('halo:settings')!)
    expect(raw.value.units).toBe('imperial')
  })

  it('merges persisted settings over defaults on load', () => {
    localStorage.setItem('halo:settings', JSON.stringify({ value: { hour12: true }, ts: 1 }))
    useSettings.getState().load()
    expect(useSettings.getState().settings.hour12).toBe(true)
    expect(useSettings.getState().settings.units).toBe(DEFAULT_SETTINGS.units)
  })

  it('keeps saved tile positions but backfills any missing tile from defaults', () => {
    localStorage.setItem('halo:settings', JSON.stringify({
      value: { layoutVersion: LAYOUT_VERSION, tileLayout: [{ i: 'clock', x: 5, y: 5, w: 2, h: 2 }] },
      ts: 1,
    }))
    useSettings.getState().load()
    const layout = useSettings.getState().settings.tileLayout
    // saved clock position is preserved
    expect(layout.find((l) => l.i === 'clock')).toEqual({ i: 'clock', x: 5, y: 5, w: 2, h: 2 })
    // every default tile still has an entry (e.g. photo, which was not saved)
    expect(layout.find((l) => l.i === 'photo')).toBeTruthy()
    expect(layout).toHaveLength(DEFAULT_LAYOUT.length)
  })

  it('discards a layout saved under an older layoutVersion and adopts the default', () => {
    // No layoutVersion (legacy save) → positions must NOT be kept.
    localStorage.setItem('halo:settings', JSON.stringify({
      value: { tileLayout: [{ i: 'clock', x: 9, y: 9, w: 1, h: 1 }] },
      ts: 1,
    }))
    useSettings.getState().load()
    const s = useSettings.getState().settings
    expect(s.tileLayout).toEqual(DEFAULT_LAYOUT)
    expect(s.layoutVersion).toBe(LAYOUT_VERSION)
  })

  it('falls back to a copy of the default layout when no tileLayout is saved', () => {
    localStorage.setItem('halo:settings', JSON.stringify({ value: { hour12: true }, ts: 1 }))
    useSettings.getState().load()
    const layout = useSettings.getState().settings.tileLayout
    expect(layout).toEqual(DEFAULT_LAYOUT)
    // must be a distinct array reference so mutations cannot leak into the shared constant
    expect(layout).not.toBe(DEFAULT_LAYOUT)
  })
})
