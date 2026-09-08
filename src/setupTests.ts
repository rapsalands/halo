import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-grid-layout's WidthProvider observes the
// container. A no-op stub is enough — tests assert presence, not geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

// jsdom has no matchMedia; components ask it for prefers-reduced-motion. The
// stub reports "no preference" so tests exercise the animated path by default;
// a test that wants the reduced path overrides window.matchMedia itself.
globalThis.matchMedia = globalThis.matchMedia ?? ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
} as MediaQueryList))
