import { describe, it, expect, beforeEach } from 'vitest'
import { useSettings } from './settings'
import { DEFAULT_SETTINGS } from './defaults'

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
})
