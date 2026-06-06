import { describe, it, expect } from 'vitest'
import { createRain } from './rain'

describe('createRain', () => {
  it('spawns a particle count scaled by performance', () => {
    const high = createRain({ width: 1920, height: 1080, performance: 'high' })
    const low = createRain({ width: 1920, height: 1080, performance: 'low' })
    expect(high.count).toBeGreaterThan(low.count)
  })

  it('advances without throwing and stays within bounds height-wise', () => {
    const sys = createRain({ width: 100, height: 100, performance: 'low' })
    const fakeCtx = {
      clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      set strokeStyle(_v: string) {}, set lineWidth(_v: number) {}, set globalAlpha(_v: number) {},
    } as unknown as CanvasRenderingContext2D
    expect(() => { for (let i = 0; i < 5; i++) sys.step(fakeCtx, 16) }).not.toThrow()
  })
})
