import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { resolveScene } from './scene'

/** Scenes where a sun/moon would actually be visible in the sky. */
const SHOW = new Set(['clear-day', 'clear-night', 'cloudy'])

function Sun() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 1.6vmin rgba(255,210,130,0.65))' }}>
      <defs>
        <radialGradient id="sun-g" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="55%" stopColor="#ffd874" />
          <stop offset="100%" stopColor="#ffb057" />
        </radialGradient>
      </defs>
      <g stroke="rgba(255,214,120,0.55)" strokeWidth="2.4" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6
          const x = 50 + Math.cos(a) * 40, y = 50 + Math.sin(a) * 40
          const x2 = 50 + Math.cos(a) * 48, y2 = 50 + Math.sin(a) * 48
          return <line key={i} x1={x} y1={y} x2={x2} y2={y2} />
        })}
      </g>
      <circle cx="50" cy="50" r="30" fill="url(#sun-g)" />
      <g fill="none" stroke="rgba(120,80,20,0.55)" strokeWidth="2.2" strokeLinecap="round">
        <path d="M42 46.5 a1 1 0 0 0 0 2" />
        <path d="M58 46.5 a1 1 0 0 0 0 2" />
        <path d="M41 56 q9 8 18 0" />
      </g>
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 1.6vmin rgba(200,214,255,0.55))' }}>
      <defs>
        <radialGradient id="moon-g" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#f6f8ff" />
          <stop offset="100%" stopColor="#c4cee6" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="30" fill="url(#moon-g)" />
      <circle cx="40" cy="40" r="4.5" fill="rgba(150,160,190,0.35)" />
      <circle cx="60" cy="56" r="6" fill="rgba(150,160,190,0.30)" />
      <circle cx="56" cy="36" r="3" fill="rgba(150,160,190,0.30)" />
      <g fill="none" stroke="rgba(80,90,130,0.55)" strokeWidth="2" strokeLinecap="round">
        <path d="M43 47 a1 1 0 0 0 0 2" />
        <path d="M57 47 a1 1 0 0 0 0 2" />
        <path d="M44 55 q6 6 12 0" />
      </g>
    </svg>
  )
}

function Bird() {
  return (
    <svg viewBox="0 0 40 14" width="100%" height="100%" aria-hidden="true">
      <path d="M2 11 Q10 2 20 10 Q30 2 38 11" fill="none"
        stroke="rgba(20,22,34,0.55)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * A whimsical, weather/time-aware sky animation: a sun (day) or moon (night)
 * drifts slowly across the sky, plus an occasional crosser — a bird gliding by
 * day, a shooting star by night. Pure SVG + CSS transforms (GPU-composited;
 * the SVG is static so there is no per-frame paint). Hidden in heavy weather,
 * gated by the "Companion" setting, and stilled by prefers-reduced-motion.
 */
export function SkyCompanion() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const on = useSettings((s) => s.settings.companion)
  const { scene, night } = resolveScene(weather, now)
  if (!on || !SHOW.has(scene)) return null
  const isMoon = scene === 'clear-night' || (scene === 'cloudy' && night)

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="halo-orbit">
        <div className="halo-bob" style={{ width: '12vmin', height: '12vmin', opacity: 0.9 }}>
          {isMoon ? <Moon /> : <Sun />}
        </div>
      </div>

      {isMoon
        ? <div className="halo-shoot" />
        : <div className="halo-bird" style={{ width: '3.4vmin', height: '1.6vmin' }}><Bird /></div>}

      <style>{`
        @keyframes halo-orbit-x { from { transform: translateX(-18vw); } to { transform: translateX(118vw); } }
        @keyframes halo-bob-y { 0%,100% { transform: translateY(2.5vh); } 50% { transform: translateY(-2.5vh); } }
        .halo-orbit { position: absolute; top: 8vh; left: 0; animation: halo-orbit-x 160s linear infinite; will-change: transform; }
        .halo-bob { animation: halo-bob-y 18s ease-in-out infinite; will-change: transform; }

        /* occasional bird — crosses in the first ~18s, then off-screen for ~60s */
        @keyframes halo-bird-x {
          0%   { transform: translate(-14vw, 0); opacity: 0; }
          3%   { opacity: 0.75; }
          24%  { transform: translate(114vw, -5vh); opacity: 0.75; }
          26%, 100% { transform: translate(114vw, -5vh); opacity: 0; }
        }
        .halo-bird { position: absolute; top: 23vh; left: 0; animation: halo-bird-x 78s linear infinite; will-change: transform, opacity; }

        /* occasional shooting star — a brief streak near the end of each cycle */
        @keyframes halo-shoot-x {
          0%, 89%  { transform: translate(0,0); opacity: 0; }
          90%      { opacity: 0; }
          91%      { opacity: 1; }
          96%      { transform: translate(-42vw, 22vh); opacity: 0.9; }
          97.5%, 100% { transform: translate(-42vw, 22vh); opacity: 0; }
        }
        .halo-shoot {
          position: absolute; top: 9vh; right: 10vw; width: 13vw; height: 2px;
          background: linear-gradient(270deg, rgba(255,255,255,0.95), rgba(255,255,255,0));
          border-radius: 2px; rotate: 152deg;
          filter: drop-shadow(0 0 4px rgba(200,220,255,0.9));
          animation: halo-shoot-x 64s linear infinite; will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .halo-orbit, .halo-bob, .halo-bird, .halo-shoot { animation: none; }
          .halo-bird, .halo-shoot { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
