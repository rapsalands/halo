import { create } from 'zustand'
import { DEFAULT_SETTINGS, DEFAULT_LAYOUT, LAYOUT_VERSION, type Settings, type LayoutItem } from './defaults'
import { saveCache, loadCache } from '../lib/storage'

const KEY = 'settings'

/** Prefer saved positions, but guarantee every default tile has an entry. */
export function mergeLayout(saved: LayoutItem[] | undefined): LayoutItem[] {
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
      // A layout saved under an older grid (different GRID_ROWS/DEFAULT_LAYOUT)
      // would render mis-sized, so discard it and adopt the current default.
      const layoutCompatible = cached.value.layoutVersion === LAYOUT_VERSION
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...cached.value,
          // Deep-merge tiles so newly-added tiles inherit their default rather
          // than being absent (and therefore hidden) for existing screens.
          enabledTiles: { ...DEFAULT_SETTINGS.enabledTiles, ...cached.value.enabledTiles },
          tileLayout: layoutCompatible ? mergeLayout(cached.value.tileLayout) : [...DEFAULT_LAYOUT],
          layoutVersion: LAYOUT_VERSION,
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
