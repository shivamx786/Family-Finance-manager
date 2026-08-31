import { db } from '@/db/database'
import { clampDay, periodKey, toISODate } from '@/lib/dates'
import { newId, stamp } from '@/lib/ids'
import type { Frequency, RecurrenceTemplate } from '@/types'

export async function generateRecurringForMonth(year: number, monthIndex: number) {
  const templates = (await db.templates.toArray()).filter((t) => t.active && !t.deletedAt)
  const monthStart = toISODate(new Date(year, monthIndex, 1))
  const monthEnd = toISODate(new Date(year, monthIndex + 1, 0))

  for (const t of templates) {
    if (t.frequency === 'one-time') continue
    if (t.startDate > monthEnd) continue
    if (t.endDate && t.endDate < monthStart) continue

    if (t.frequency === 'yearly' && monthIndex !== new Date(t.startDate + 'T00:00:00').getMonth()) continue
    if (t.frequency === 'quarterly' && monthIndex % 3 !== new Date(t.startDate + 'T00:00:00').getMonth() % 3) {
      continue
    }

    const key = periodKey(year, monthIndex, t.frequency)
    await createFromTemplate(t, year, monthIndex, key)
  }
}

async function createFromTemplate(t: RecurrenceTemplate, year: number, monthIndex: number, key: string) {
  const expectedDate = clampDay(year, monthIndex, t.expectedDay)

  if (t.kind === 'income') {
    const existing = await db.incomes.where('[templateId+periodKey]').equals([t.id, key]).first()
    if (existing) return
    await db.incomes.add({
      id: newId(),
      name: t.name,
      personId: t.personId,
      propertyId: t.propertyId,
      categoryId: t.categoryId,
      expectedAmount: t.amount,
      expectedDate,
      frequency: t.frequency,
      templateId: t.id,
      periodKey: key,
      status: 'pending',
      notes: t.notes,
      isDemo: t.isDemo,
      ...stamp(),
    })
    return
  }

  const existingBill = await db.bills.where('[templateId+periodKey]').equals([t.id, key]).first()
  if (existingBill) return
  await db.bills.add({
    id: newId(),
    name: t.name,
    categoryId: t.categoryId,
    amount: t.amount,
    dueDate: expectedDate,
    frequency: t.frequency,
    personId: t.personId,
    propertyId: t.propertyId,
    notes: t.notes,
    templateId: t.id,
    periodKey: key,
    isDemo: t.isDemo,
    ...stamp(),
  })
}

export function frequencyLabel(f: Frequency): string {
  if (f === 'one-time') return 'One time'
  return f.charAt(0).toUpperCase() + f.slice(1)
}
