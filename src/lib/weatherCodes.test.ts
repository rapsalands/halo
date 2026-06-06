import { describe, it, expect } from 'vitest'
import { describeCode, sceneFor } from './weatherCodes'

describe('describeCode', () => {
  it('labels representative codes', () => {
    expect(describeCode(0).label).toBe('Clear sky')
    expect(describeCode(3).condition).toBe('overcast')
    expect(describeCode(45).condition).toBe('fog')
    expect(describeCode(63).condition).toBe('rain')
    expect(describeCode(75).condition).toBe('snow')
    expect(describeCode(95).condition).toBe('thunder')
  })

  it('falls back gracefully for unknown codes', () => {
    expect(describeCode(999).label).toBe('Unknown')
    expect(describeCode(999).condition).toBe('cloudy')
  })
})

describe('sceneFor', () => {
  it('splits clear by day/night', () => {
    expect(sceneFor(0, true)).toBe('clear-day')
    expect(sceneFor(1, false)).toBe('clear-night')
  })
  it('maps weather families to scenes', () => {
    expect(sceneFor(2, true)).toBe('cloudy')
    expect(sceneFor(3, true)).toBe('cloudy')
    expect(sceneFor(48, true)).toBe('fog')
    expect(sceneFor(51, true)).toBe('rain')
    expect(sceneFor(82, true)).toBe('rain')
    expect(sceneFor(73, true)).toBe('snow')
    expect(sceneFor(86, true)).toBe('snow')
    expect(sceneFor(99, true)).toBe('thunder')
  })
})
