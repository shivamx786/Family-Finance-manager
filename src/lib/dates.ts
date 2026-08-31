import {
  addDays,
  endOfWeek,
  format,
  getISOWeek,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfWeek,
} from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function parseDate(iso: string): Date {
  return parseISO(iso.slice(0, 10))
}

export function monthLabel(year: number, monthIndex: number): string {
  return format(new Date(year, monthIndex, 1), 'MMMM yyyy')
}

export function inMonth(iso: string, year: number, monthIndex: number): boolean {
  const d = parseDate(iso)
  return d.getFullYear() === year && d.getMonth() === monthIndex
}

export function clampDay(year: number, monthIndex: number, day: number): string {
  const last = new Date(year, monthIndex + 1, 0).getDate()
  return toISODate(new Date(year, monthIndex, Math.min(day, last)))
}

export function periodKey(year: number, monthIndex: number, frequency: string, date = new Date(year, monthIndex, 1)): string {
  if (frequency === 'yearly') return `${year}`
  if (frequency === 'quarterly') return `${year}-Q${Math.floor(monthIndex / 3) + 1}`
  if (frequency === 'weekly') return `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, '0')}`
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function isOverdue(dueISO: string, today = todayISO()): boolean {
  return isBefore(parseDate(dueISO), parseDate(today))
}

export function isDueToday(dueISO: string, today = todayISO()): boolean {
  return isEqual(parseDate(dueISO), parseDate(today))
}

export function isDueThisWeek(dueISO: string, today = new Date()): boolean {
  const due = parseDate(dueISO)
  const start = startOfWeek(today, { weekStartsOn: 0 })
  const end = endOfWeek(today, { weekStartsOn: 0 })
  return (isAfter(due, start) || isEqual(due, start)) && (isBefore(due, end) || isEqual(due, end))
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(parseDate(iso), days))
}

export type DateRange = { start: string; end: string }

export function rangeForPreset(
  preset: 'this-month' | 'last-month' | 'last-3' | 'last-6' | 'this-year' | 'custom',
  custom?: DateRange,
  now = new Date(),
): DateRange {
  const y = now.getFullYear()
  const m = now.getMonth()
  if (preset === 'custom' && custom) return custom
  if (preset === 'this-month') {
    return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m + 1, 0)) }
  }
  if (preset === 'last-month') {
    return { start: toISODate(new Date(y, m - 1, 1)), end: toISODate(new Date(y, m, 0)) }
  }
  if (preset === 'last-3') {
    return { start: toISODate(new Date(y, m - 2, 1)), end: toISODate(new Date(y, m + 1, 0)) }
  }
  if (preset === 'last-6') {
    return { start: toISODate(new Date(y, m - 5, 1)), end: toISODate(new Date(y, m + 1, 0)) }
  }
  return { start: toISODate(new Date(y, 0, 1)), end: toISODate(new Date(y, 11, 31)) }
}

export function inRange(iso: string, range: DateRange): boolean {
  return iso >= range.start && iso <= range.end
}
