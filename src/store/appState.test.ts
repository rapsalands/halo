import { describe, it, expect, beforeEach } from 'vitest'
import { useAppState } from './appState'

describe('appState store', () => {
  beforeEach(() => useAppState.setState({ now: new Date('2026-06-06T10:00:00'), weather: null, location: null }))

  it('holds a ticking now', () => {
    const t = new Date('2026-06-06T10:00:01')
    useAppState.getState().setNow(t)
    expect(useAppState.getState().now).toBe(t)
  })

  it('stores weather and location', () => {
    useAppState.getState().setLocation({ lat: 1, lon: 2, name: 'Test' })
    expect(useAppState.getState().location?.name).toBe('Test')
  })

  it('defaults editMode off and toggles it', () => {
    expect(useAppState.getState().editMode).toBe(false)
    useAppState.getState().setEditMode(true)
    expect(useAppState.getState().editMode).toBe(true)
    useAppState.getState().setEditMode(false)
    expect(useAppState.getState().editMode).toBe(false)
  })
})
