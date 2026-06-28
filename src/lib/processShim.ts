// react-grid-layout's build (and its react-draggable/react-resizable deps) read
// `process.env.NODE_ENV` at runtime. Browsers have no global `process`, so those
// reads throw `process is not defined` *inside RGL's drag/resize machinery*,
// silently killing drag and resize. Vite statically replaces React's own
// dot-form `process.env.NODE_ENV` at build time, but RGL's bundle uses bracket
// access (`process.env["NODE_ENV"]`) which static replacement misses — so we
// provide the global at runtime. Imported first in main.tsx, before any RGL code.
const g = globalThis as { process?: { env: Record<string, string | undefined> } }
if (!g.process) g.process = { env: { NODE_ENV: import.meta.env.MODE } }

export {}
