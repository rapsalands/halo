import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-grid-layout's WidthProvider observes the
// container. A no-op stub is enough — tests assert presence, not geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)
