import { create } from 'zustand'
import { DEFAULT_SETTINGS, DEFAULT_LAYOUT, LAYOUT_VERSION, type Settings, type LayoutItem } from './defaults'
import { saveCache, loadCache } from '../lib/storage'
import { sanitizeSettings } from './sanitizeSettings'

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
  // Clone so the live state never aliases the shared DEFAULT_SETTINGS constant
  // (its nested tileLayout/enabledTiles objects could otherwise be mutated).
  settings: structuredClone(DEFAULT_SETTINGS),
  load: () => {
    try {
      const cached = loadCache<Partial<Settings>>(KEY)
      if (!cached) return
      // Never trust persisted bytes: a corrupt or tampered blob (incl. one a
      // hostile `?config=` wrote earlier) is validated field-by-field, so a
      // bad shape can't crash boot on this 24/7 kiosk.
      const clean = sanitizeSettings(cached.value)
      // A layout saved under an older grid (different GRID_ROWS/DEFAULT_LAYOUT)
      // would render mis-sized, so discard it and adopt the current default.
      const layoutCompatible = clean.layoutVersion === LAYOUT_VERSION
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...clean,
          // Deep-merge tiles so newly-added tiles inherit their default rather
          // than being absent (and therefore hidden) for existing screens.
          enabledTiles: { ...DEFAULT_SETTINGS.enabledTiles, ...clean.enabledTiles },
          tileLayout: layoutCompatible ? mergeLayout(clean.tileLayout) : [...DEFAULT_LAYOUT],
          layoutVersion: LAYOUT_VERSION,
        },
      })
    } catch {
      /* unreadable/corrupt store — keep the in-memory defaults so the app boots */
    }
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch }
    saveCache(KEY, next)
    set({ settings: next })
  },
  reset: () => set({ settings: structuredClone(DEFAULT_SETTINGS) }),
}))
