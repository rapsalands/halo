import type { ParticleInit, ParticleSystem } from './types'

interface Drop { x: number; y: number; len: number; speed: number }

export function createRain(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 320 : 110
  const drops: Drop[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    len: 12 + Math.random() * 18,
    speed: 600 + Math.random() * 500, // px per second
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)'
      ctx.lineWidth = 1.2
      for (const d of drops) {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x, d.y + d.len)
        ctx.stroke()
        d.y += d.speed * sec
        if (d.y > height) { d.y = -d.len; d.x = Math.random() * width }
      }
    },
  }
}
