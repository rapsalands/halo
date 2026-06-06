interface Props { accent: string }

/**
 * Slow-drifting radial glow blobs that keep the screen alive even in calm
 * conditions, so the centre is never a dead flat void. Tinted by the scene accent.
 */
export function AuroraGlow({ accent }: Props) {
  const blob = (x: string, y: string, size: number, color: string, dur: number, delay: number) => ({
    position: 'absolute' as const,
    left: x, top: y, width: size, height: size, borderRadius: '50%',
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    filter: 'blur(40px)',
    animation: `halo-drift ${dur}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none' as const,
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.55 }}>
      <style>{`
        @keyframes halo-drift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(6vw, 4vh) scale(1.15); }
          66%  { transform: translate(-4vw, -3vh) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
      <div style={blob('8%', '20%', 480, accent, 38, 0)} />
      <div style={blob('60%', '50%', 620, accent, 52, -8)} />
      <div style={blob('38%', '8%', 380, '#ffffff', 44, -16)} />
    </div>
  )
}
