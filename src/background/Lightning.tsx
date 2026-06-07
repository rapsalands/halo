/**
 * Periodic lightning for the thunder scene: two full-screen flash overlays on
 * different cadences (so strikes feel irregular) plus a quick bolt. Pure CSS.
 */
export function Lightning() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes halo-flash-a {
          0%, 100% { opacity: 0; }
          1% { opacity: 0.9; }
          3% { opacity: 0.15; }
          5% { opacity: 0.75; }
          7% { opacity: 0; }
        }
        @keyframes halo-flash-b {
          0%, 100% { opacity: 0; }
          48% { opacity: 0; }
          49% { opacity: 0.85; }
          51% { opacity: 0.1; }
          53% { opacity: 0.6; }
          55% { opacity: 0; }
        }
        @keyframes halo-bolt {
          0%, 100% { opacity: 0; }
          1.5% { opacity: 1; }
          5% { opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(220,228,255,0.9)',
        animation: 'halo-flash-a 7s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(200,215,255,0.8)',
        animation: 'halo-flash-b 11s ease-out infinite',
      }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
        style={{
          position: 'absolute', top: '6%', left: '52%', width: '14vh', height: '40vh',
          animation: 'halo-bolt 7s ease-out infinite',
          filter: 'drop-shadow(0 0 12px rgba(220,230,255,0.9))',
        }}>
        <polygon points="55,2 30,52 48,52 38,98 78,40 56,40 70,2" fill="#eef3ff" />
      </svg>
    </div>
  )
}
