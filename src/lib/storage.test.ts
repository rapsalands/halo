import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { saveCache, loadCache, isStale } from './storage'

describe('storage cache', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('returns null when nothing is cached', () => {
    expect(loadCache<number>('missing')).toBeNull()
  })

  it('round-trips a value with a timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    saveCache('weather', { temp: 24 })
    const got = loadCache<{ temp: number }>('weather')
    expect(got).toEqual({ value: { temp: 24 }, ts: Date.parse('2026-06-06T10:00:00Z') })
  })

  it('flags an entry as stale once older than maxAge', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    saveCache('weather', { temp: 24 })
    vi.setSystemTime(new Date('2026-06-06T10:20:00Z')) // +20 min
    const got = loadCache<{ temp: number }>('weather')!
    expect(isStale(got, 15 * 60_000)).toBe(true)
    expect(isStale(got, 30 * 60_000)).toBe(false)
  })

  it('survives corrupt JSON by returning null', () => {
    localStorage.setItem('halo:bad', '{not json')
    expect(loadCache('bad')).toBeNull()
  })
})
