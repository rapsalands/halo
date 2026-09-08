import { describeCode } from '../lib/weatherCodes'
import './weatherIcon.css'

interface Props {
  code: number
  isDay: boolean
  size?: number
  /** Animate the icon. Off by default: a dashboard shows many of these at once
   *  and each perpetual animation holds the compositor at full frame rate, so
   *  only the current-conditions icon earns the cost. */
  animated?: boolean
}

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

/** SVG weather icon. Motion is opt-in — see `animated` — and keyframes live in
 *  weatherIcon.css so the thirteen icons on a dashboard share one definition. */
export function WeatherIcon({ code, isDay, size = 64, animated = false }: Props) {
  const kind = kindFor(code, isDay)
  const cls = (name: string) => (animated ? name : undefined)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ overflow: 'visible' }}>
      {(kind === 'sun' || kind === 'partly-day') && (
        <g>
          {kind === 'sun' && (
            <g className={cls('wi-rays')} stroke={SUN} strokeWidth="2.4" strokeLinecap="round">
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
              className={cls('wi-raindrop')} style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </g>
      )}

      {kind === 'snow' && (
        <g fill="#ffffff">
          {[20, 30, 40].map((x, i) => (
            <circle key={x} cx={x} cy="52" r="2"
              className={cls('wi-snowflake')} style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </g>
      )}

      {kind === 'thunder' && (
        <polygon points="30,48 38,48 32,56 38,56 28,66 31,57 26,57"
          fill="#ffd33d" className={cls('wi-bolt')} />
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
