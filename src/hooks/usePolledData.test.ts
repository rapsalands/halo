import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePolledData } from './usePolledData'

describe('usePolledData', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('populates data from the fetcher', async () => {
    const { result } = renderHook(() => usePolledData('k', async () => 42, 60_000))
    await waitFor(() => expect(result.current.data).toBe(42))
    expect(result.current.stale).toBe(false)
  })

  it('keeps the cached good value when the fetcher later changes to a failing one', async () => {
    const { result, rerender } = renderHook(
      ({ f }: { f: () => Promise<number> }) => usePolledData('k2', f, 60_000),
      { initialProps: { f: async () => 7 } },
    )
    await waitFor(() => expect(result.current.data).toBe(7))
    rerender({ f: async () => { throw new Error('down') } })
    expect(result.current.data).toBe(7)
  })
})
