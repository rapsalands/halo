import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNowTick, useLocalHour, useToday } from './useNow'
import { useAppState } from '../store/appState'

const setNow = (d: Date) => act(() => { useAppState.getState().setNow(d) })

describe('useNowTick', () => {
  it('is stable within the same minute and updates on the next minute (seconds=false)', () => {
    setNow(new Date('2026-06-29T10:30:15.000Z'))
    const { result } = renderHook(() => useNowTick(false))
    const first = result.current
    setNow(new Date('2026-06-29T10:30:55.000Z')) // same minute → no re-render
    expect(result.current).toBe(first)
    setNow(new Date('2026-06-29T10:31:05.000Z')) // next minute
    expect(result.current).not.toBe(first)
    expect(result.current.getTime()).toBe(Date.parse('2026-06-29T10:31:00.000Z'))
  })

  it('updates every second when seconds=true', () => {
    setNow(new Date('2026-06-29T10:30:15.000Z'))
    const { result } = renderHook(() => useNowTick(true))
    const first = result.current
    setNow(new Date('2026-06-29T10:30:16.000Z'))
    expect(result.current).not.toBe(first)
    expect(result.current.getTime()).toBe(Date.parse('2026-06-29T10:30:16.000Z'))
  })
})

describe('useLocalHour', () => {
  it('returns the local hour and is stable within the hour', () => {
    setNow(new Date(2026, 5, 29, 14, 30))
    const { result } = renderHook(() => useLocalHour())
    expect(result.current).toBe(14)
    setNow(new Date(2026, 5, 29, 14, 59))
    expect(result.current).toBe(14)
    setNow(new Date(2026, 5, 29, 15, 0))
    expect(result.current).toBe(15)
  })
})

describe('useToday', () => {
  it('returns local Y/M/D and updates only when the day rolls over', () => {
    setNow(new Date(2026, 5, 29, 10, 0))
    const { result } = renderHook(() => useToday())
    const first = result.current
    expect(first).toEqual({ year: 2026, month: 5, day: 29, iso: '2026-06-29' })
    setNow(new Date(2026, 5, 29, 23, 0)) // same local day → stable reference
    expect(result.current).toBe(first)
    setNow(new Date(2026, 5, 30, 1, 0)) // next day
    expect(result.current).not.toBe(first)
    expect(result.current.day).toBe(30)
  })
})
