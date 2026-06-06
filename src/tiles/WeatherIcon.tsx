import { describeCode } from '../lib/weatherCodes'

interface Props { code: number; isDay: boolean; size?: number }

type IconKind = 'sun' | 'moon' | 'partly-day' | 'partly-night' | 'cloud' | 'rain' | 'snow' | 'thunder' | 'fog'

function kindFor(code: number, isDay: boolean): IconKind {
  const { condition } = describeCode(code)
  switch (condition) {
    case 'clear': return isDay ? 'sun' : 'moon'
    case 'partly': return isDay ? 'partly-day' : 'partly-night'
    case 'overcast':
    case 'cloudy': return 'cloud'
    case 'fog': return 'fog'
    case 'drizzle':
    case 'rain': return 'rain'
    case 'snow': return 'snow'
    case 'thunder': return 'thunder'
    default: return 'cloud'
  }
}

const SUN = '#ffd86b'
const CLOUD = '#e6ecf5'
const CLOUD_DARK = '#b9c4d6'

/** Animated SVG weather icon. Uses scoped CSS keyframes for subtle motion. */
export function WeatherIcon({ code, isDay, size = 64 }: Props) {
  const kind = kindFor(code, isDay)
  const id = `wi-${kind}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ overflow: 'visible' }}>
      <style>{`
        @keyframes ${id}-spin { to { transform: rotate(360deg); } }
        @keyframes ${id}-drop { 0% { transform: translateY(-2px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }
        @keyframes ${id}-flake { 0% { transform: translateY(-2px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(11px); opacity: 0; } }
        @keyframes ${id}-flash { 0%, 92%, 100% { opacity: 0.25; } 94%, 98% { opacity: 1; } }
        .${id}-rays { transform-origin: 22px 22px; animation: ${id}-spin 30s linear infinite; }
      `}</style>

      {(kind === 'sun' || kind === 'partly-day') && (
        <g>
          {kind === 'sun' && (
            <g className={`${id}-rays`} stroke={SUN} strokeWidth="2.4" strokeLinecap="round">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4
                return <line key={i} x1={22 + Math.cos(a) * 15} y1={22 + Math.sin(a) * 15}
                  x2={22 + Math.cos(a) * 21} y2={22 + Math.sin(a) * 21} />
              })}
            </g>
          )}
          <circle cx={kind === 'sun' ? 22 : 24} cy={kind === 'sun' ? 22 : 20} r="11"
            fill={SUN} />
        </g>
      )}

      {(kind === 'moon' || kind === 'partly-night') && (
        <path d="M40 20 a13 13 0 1 0 4 14 a10 10 0 0 1 -4 -14 z" fill="#dfe6f5" />
      )}

      {kind !== 'sun' && kind !== 'moon' && (
        <g>
          <ellipse cx="34" cy="40" rx="20" ry="13" fill={kind === 'thunder' || kind === 'rain' ? CLOUD_DARK : CLOUD} />
          <ellipse cx="22" cy="42" rx="13" ry="10" fill={kind === 'thunder' || kind === 'rain' ? CLOUD_DARK : CLOUD} />
        </g>
      )}

      {kind === 'rain' && (
        <g stroke="#7fb3e6" strokeWidth="2.6" strokeLinecap="round">
          {[20, 30, 40].map((x, i) => (
            <line key={x} x1={x} y1="50" x2={x} y2="54"
              style={{ animation: `${id}-drop 1.1s linear ${i * 0.25}s infinite` }} />
          ))}
        </g>
      )}

      {kind === 'snow' && (
        <g fill="#ffffff">
          {[20, 30, 40].map((x, i) => (
            <circle key={x} cx={x} cy="52" r="2"
              style={{ animation: `${id}-flake 1.6s linear ${i * 0.3}s infinite` }} />
          ))}
        </g>
      )}

      {kind === 'thunder' && (
        <polygon points="30,48 38,48 32,56 38,56 28,66 31,57 26,57"
          fill="#ffd33d" style={{ animation: `${id}-flash 3s ease-in-out infinite` }} />
      )}

      {kind === 'fog' && (
        <g stroke={CLOUD} strokeWidth="2.6" strokeLinecap="round" opacity="0.85">
          <line x1="16" y1="52" x2="48" y2="52" />
          <line x1="20" y1="57" x2="44" y2="57" />
        </g>
      )}
    </svg>
  )
}
