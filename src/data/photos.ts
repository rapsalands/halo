export function photoUrl(seed: string | number, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export function photoSequence(count: number, w: number, h: number): string[] {
  return Array.from({ length: count }, (_, i) => photoUrl(`halo-${i}`, w, h))
}
