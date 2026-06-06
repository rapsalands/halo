import type { ParticleInit, ParticleSystem } from './types'

interface Flake { x: number; y: number; r: number; speed: number; drift: number; phase: number }

export function createSnow(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 220 : 80
  const flakes: Flake[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1.5 + Math.random() * 2.5,
    speed: 40 + Math.random() * 50,
    drift: 20 + Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (const f of flakes) {
        f.phase += sec
        f.y += f.speed * sec
        f.x += Math.sin(f.phase) * f.drift * sec
        if (f.y > height) { f.y = -f.r; f.x = Math.random() * width }
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}
