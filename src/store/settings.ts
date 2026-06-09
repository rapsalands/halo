import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Settings } from './defaults'
import { saveCache, loadCache } from '../lib/storage'

const KEY = 'settings'

interface SettingsState {
  settings: Settings
  load: () => void
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: () => {
    const cached = loadCache<Partial<Settings>>(KEY)
    if (cached) {
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...cached.value,
          // Deep-merge tiles so newly-added tiles inherit their default rather
          // than being absent (and therefore hidden) for existing screens.
          enabledTiles: { ...DEFAULT_SETTINGS.enabledTiles, ...cached.value.enabledTiles },
        },
      })
    }
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch }
    saveCache(KEY, next)
    set({ settings: next })
  },
  reset: () => set({ settings: DEFAULT_SETTINGS }),
}))
