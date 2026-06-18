import { useEffect, useState } from 'react'

const NET_STATE_URL = '/api/net/state'
const POLL_INTERVAL = 10_000

function navigatorOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

/**
 * Live online/offline signal. The kiosk's verified connectivity is the source
 * of truth: this polls the same-origin /api/net/state endpoint and reports its
 * `internet_reachable` verdict (Wi-Fi-without-internet correctly reads offline).
 * When that endpoint is absent (standalone github.io deployment) or fails, it
 * falls back to navigator.onLine. Internet-dependent tiles use this to hide
 * when there is no connection and return automatically when the link is back.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(navigatorOnline)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(NET_STATE_URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`net state ${res.status}`)
        const json = await res.json()
        if (!cancelled) setOnline(!!json.internet_reachable)
      } catch {
        // No kiosk net-state endpoint (or it failed) — trust the browser.
        if (!cancelled) setOnline(navigatorOnline())
      }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL)

    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      cancelled = true
      clearInterval(id)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
