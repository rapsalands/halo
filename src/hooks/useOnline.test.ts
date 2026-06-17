import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnline } from './useOnline'

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

afterEach(() => vi.restoreAllMocks())

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
})
