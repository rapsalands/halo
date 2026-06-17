import { useEffect, useState } from 'react'

/**
 * Live online/offline signal from the browser (navigator.onLine + the online/
 * offline events). The kiosk uses this to hide internet-dependent tiles when
 * there is no connection, so they never show a spinner or error — they return
 * automatically when the link is back.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}
