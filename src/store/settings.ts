import { create } from 'zustand'
import { DEFAULT_SETTINGS, DEFAULT_LAYOUT, type Settings, type LayoutItem } from './defaults'
import { saveCache, loadCache } from '../lib/storage'

const KEY = 'settings'

/** Prefer saved positions, but guarantee every default tile has an entry. */
function mergeLayout(saved: LayoutItem[] | undefined): LayoutItem[] {
  if (!saved?.length) return [...DEFAULT_LAYOUT]
  const byId = new Map(saved.map((it) => [it.i, it]))
  return DEFAULT_LAYOUT.map((def) => byId.get(def.i) ?? def)
}

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
          tileLayout: mergeLayout(cached.value.tileLayout),
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
