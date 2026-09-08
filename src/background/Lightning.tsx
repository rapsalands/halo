/**
 * Periodic lightning for the thunder scene: two full-screen flash overlays on
 * different cadences (so strikes feel irregular) plus a quick bolt. Pure CSS.
 *
 * The overlays are full-screen and run perpetually, so they are classed rather
 * than styled inline — a class is what a media query can switch off, and the
 * kiosk asks for reduced motion to stand the whole dashboard still.
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
        .halo-flash-a { animation: halo-flash-a 7s ease-out infinite; }
        .halo-flash-b { animation: halo-flash-b 11s ease-out infinite; }
        .halo-bolt { animation: halo-bolt 7s ease-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .halo-flash-a, .halo-flash-b, .halo-bolt { animation: none; opacity: 0; }
        }
      `}</style>
      <div className="halo-flash-a" style={{
        position: 'absolute', inset: 0, background: 'rgba(220,228,255,0.9)',
      }} />
      <div className="halo-flash-b" style={{
        position: 'absolute', inset: 0, background: 'rgba(200,215,255,0.8)',
      }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="halo-bolt"
        style={{
          position: 'absolute', top: '6%', left: '52%', width: '14vh', height: '40vh',
          filter: 'drop-shadow(0 0 12px rgba(220,230,255,0.9))',
        }}>
        <polygon points="55,2 30,52 48,52 38,98 78,40 56,40 70,2" fill="#eef3ff" />
      </svg>
    </div>
  )
}
