export interface CalendarDay { day: number; inMonth: boolean; iso: string }

export function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 42-cell Sunday-first grid covering `month` (0-indexed) plus padding days. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1)
  const startDow = first.getDay() // 0 = Sunday
  const cells: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    cells.push({ day: d.getDate(), inMonth: d.getMonth() === month, iso: isoOf(d) })
  }
  return cells
}
