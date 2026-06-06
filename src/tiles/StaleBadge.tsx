import { useAppState } from '../store/appState'

export function StaleBadge() {
  const weather = useAppState((s) => s.weather)
  if (!weather?.stale) return null
  return (
    <div style={{
      position: 'absolute', bottom: 10, right: 14, zIndex: 5,
      fontSize: '0.72rem', color: '#ffd27e', opacity: 0.8,
      background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: 12,
    }}>
      ⚠ Offline — showing last update
    </div>
  )
}
