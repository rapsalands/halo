import { describe, it, expect } from 'vitest'
import { photoUrl, photoSequence } from './photos'

describe('photos', () => {
  it('builds a Picsum seeded URL at the requested size', () => {
    expect(photoUrl('halo-3', 1920, 1080)).toBe('https://picsum.photos/seed/halo-3/1920/1080')
  })
  it('produces a sequence of distinct seeds', () => {
    const seq = photoSequence(5, 800, 600)
    expect(seq).toHaveLength(5)
    expect(new Set(seq).size).toBe(5)
  })
})
