import type { Settings } from '../store/defaults'

export function encodeConfig(settings: Settings): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(settings))))
}

export function decodeConfig(blob: string): Partial<Settings> | null {
  try {
    const json = decodeURIComponent(escape(atob(blob)))
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object') return parsed as Partial<Settings>
    return null
  } catch {
    return null
  }
}

export function readConfigFromSearch(search: string): Partial<Settings> | null {
  const param = new URLSearchParams(search).get('config')
  if (!param) return null
  return decodeConfig(param)
}
