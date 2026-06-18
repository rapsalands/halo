import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useOnline } from './useOnline'

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

function stubNetState(internet_reachable: boolean) {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ internet_reachable }),
  })))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useOnline', () => {
  it('reflects navigator.onLine on mount', () => {
    setOnline(false)
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(false)
  })

  it('flips to false on an offline event and back on online', () => {
    setOnline(true)
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(true)
    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)
    act(() => window.dispatchEvent(new Event('online')))
    expect(result.current).toBe(true)
  })

  it('reports offline when the kiosk net-state says internet is unreachable', async () => {
    setOnline(true) // navigator would lie (Wi-Fi without internet)
    stubNetState(false)
    const { result } = renderHook(() => useOnline())
    await waitFor(() => expect(result.current).toBe(false))
  })

  it('falls back to navigator.onLine when the net-state fetch rejects', async () => {
    setOnline(true)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no endpoint') }))
    const { result } = renderHook(() => useOnline())
    await waitFor(() => expect(result.current).toBe(true))
  })
})
