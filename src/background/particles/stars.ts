import type { ParticleInit, ParticleSystem } from './types'

interface Star { x: number; y: number; r: number; twinkle: number; phase: number }

export function createStars(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 180 : 80
  const stars: Star[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.7,
    r: 0.6 + Math.random() * 1.4,
    twinkle: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#ffffff'
      for (const s of stars) {
        s.phase += sec * s.twinkle
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
  }
}
