import { db } from '@/db/database'
import { rupeesToPaisa } from '@/lib/money'
import { newId, stamp, nowISO } from '@/lib/ids'
import { generateRecurringForMonth } from '@/lib/recurrence'
import type { Person, Property } from '@/types'

export async function completeSetup(input: {
  people: { id?: string; name: string }[]
  properties: { id?: string; name: string; location?: string; monthlyRentExpected: number; tenantName?: string }[]
  incomes: {
    name: string
    amount: number
    expectedDay: number
    frequency: 'monthly' | 'one-time'
    personId?: string
    propertyId?: string
    categoryId?: string
  }[]
  bills: {
    name: string
    amount: number
    expectedDay: number
    categoryId?: string
    propertyId?: string
    personId?: string
  }[]
  loadDemo: boolean
}) {
  const ts = stamp()
  for (const p of input.people) {
    const name = p.name.trim()
    if (!name) continue
    await db.people.put({
      id: p.id || newId(),
      name,
      isDefault: true,
      ...ts,
    })
  }
  for (const h of input.properties) {
    const name = h.name.trim()
    if (!name) continue
    await db.properties.put({
      id: h.id || newId(),
      name,
      location: h.location,
      monthlyRentExpected: h.monthlyRentExpected,
      tenantName: h.tenantName,
      ...ts,
    })
  }
  for (const inc of input.incomes) {
    if (inc.amount <= 0) continue
    await db.templates.add({
      id: newId(),
      kind: 'income',
      name: inc.name,
      amount: inc.amount,
      frequency: inc.frequency,
      expectedDay: inc.expectedDay,
      personId: inc.personId,
      propertyId: inc.propertyId,
      categoryId: inc.categoryId,
      startDate: new Date().toISOString().slice(0, 10),
      active: true,
      ...ts,
    })
  }
  for (const b of input.bills) {
    if (b.amount <= 0) continue
    await db.templates.add({
      id: newId(),
      kind: 'bill',
      name: b.name,
      amount: b.amount,
      frequency: 'monthly',
      expectedDay: b.expectedDay,
      categoryId: b.categoryId,
      propertyId: b.propertyId,
      personId: b.personId,
      startDate: new Date().toISOString().slice(0, 10),
      active: true,
      ...ts,
    })
  }

  const now = new Date()
  await generateRecurringForMonth(now.getFullYear(), now.getMonth())
  if (input.loadDemo) await loadDemoData()
  const settings = await db.settings.get('app')
  if (settings) {
    await db.settings.put({
      ...settings,
      setupComplete: true,
      demoLoaded: input.loadDemo,
    })
  }
}

export async function loadDemoData() {
  const people = (await db.people.toArray()).filter((p) => !p.deletedAt)
  const houses = (await db.properties.toArray()).filter((p) => !p.deletedAt)
  const findPerson = (name: string) => people.find((p) => p.name.toLowerCase() === name.toLowerCase())
  const ktm = houses.find((h) => h.name.toLowerCase().includes('kathmandu'))
  const village = houses.find((h) => h.name.toLowerCase().includes('village'))
  const sister = findPerson('Sister')
  const shivam = findPerson('Shivam')
  const ramId = newId()
  const hariId = newId()
  await db.people.bulkAdd([
    { id: ramId, name: 'Ram', isDemo: true, ...stamp() },
    { id: hariId, name: 'Hari', isDemo: true, ...stamp() },
  ])

  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const iso = (day: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(Math.min(day, new Date(y, m + 1, 0).getDate())).padStart(2, '0')}`

  const incomes = (await db.incomes.toArray()).filter((i) => !i.deletedAt)
  const mother = incomes.find((i) => i.name.toLowerCase().includes('mother'))
  const ktmRent = incomes.find((i) => i.name.toLowerCase().includes('kathmandu'))
  if (mother) {
    await db.receipts.add({
      id: newId(),
      incomeId: mother.id,
      amount: mother.expectedAmount,
      date: iso(28),
      notes: 'Demo: salary received',
      isDemo: true,
      ...stamp(),
    })
    await db.incomes.update(mother.id, { status: 'received', receivedDate: iso(28), isDemo: true, updatedAt: nowISO() })
  }
  if (ktmRent) {
    await db.receipts.add({
      id: newId(),
      incomeId: ktmRent.id,
      amount: rupeesToPaisa(12000),
      date: iso(20),
      notes: 'Demo: partial rent',
      isDemo: true,
      ...stamp(),
    })
    await db.incomes.update(ktmRent.id, { status: 'partial', isDemo: true, updatedAt: nowISO() })
  }

  await db.expenses.bulkAdd([
    {
      id: newId(),
      amount: rupeesToPaisa(15000),
      categoryId: 'cat-food',
      personId: findPerson('Family')?.id,
      date: iso(5),
      paidDate: iso(5),
      status: 'paid',
      notes: 'Groceries and kitchen',
      isDemo: true,
      ...stamp(),
    },
    {
      id: newId(),
      amount: rupeesToPaisa(8000),
      categoryId: 'cat-education',
      personId: sister?.id,
      date: iso(10),
      paidDate: iso(10),
      status: 'paid',
      notes: "Sister's college fee",
      isDemo: true,
      ...stamp(),
    },
    {
      id: newId(),
      amount: rupeesToPaisa(2500),
      categoryId: 'cat-education',
      personId: shivam?.id,
      date: iso(12),
      paidDate: iso(12),
      status: 'paid',
      notes: 'IELTS class',
      isDemo: true,
      ...stamp(),
    },
    {
      id: newId(),
      amount: rupeesToPaisa(850),
      categoryId: 'cat-water',
      propertyId: ktm?.id,
      date: iso(15),
      paidDate: iso(15),
      status: 'paid',
      notes: 'Water bill for Kathmandu house',
      isDemo: true,
      ...stamp(),
    },
  ])

  const bills = (await db.bills.toArray()).filter((b) => !b.deletedAt)
  const elec = bills.find((b) => b.name.toLowerCase().includes('electric'))
  if (elec) {
    await db.bills.update(elec.id, {
      amount: rupeesToPaisa(3200),
      propertyId: ktm?.id,
      notes: 'Electricity bill for Kathmandu house',
      isDemo: true,
      updatedAt: nowISO(),
    })
  }

  const weOweId = newId()
  const theyOweId = newId()
  await db.loans.bulkAdd([
    {
      id: weOweId,
      direction: 'we_owe',
      personId: ramId,
      personName: 'Ram',
      originalAmount: rupeesToPaisa(50000),
      date: iso(1),
      description: 'Borrowed from Ram',
      notes: 'Demo loan',
      isDemo: true,
      ...stamp(),
    },
    {
      id: theyOweId,
      direction: 'they_owe',
      personId: hariId,
      personName: 'Hari',
      originalAmount: rupeesToPaisa(20000),
      date: iso(3),
      description: 'Lent to Hari',
      notes: 'Demo receivable',
      isDemo: true,
      ...stamp(),
    },
  ])
  await db.repayments.bulkAdd([
    { id: newId(), loanId: weOweId, amount: rupeesToPaisa(20000), date: iso(18), notes: 'Partial repayment', isDemo: true, ...stamp() },
    { id: newId(), loanId: theyOweId, amount: rupeesToPaisa(5000), date: iso(22), notes: 'Hari paid back part', isDemo: true, ...stamp() },
  ])

  if (ktm) {
    await db.properties.update(ktm.id, {
      monthlyRentExpected: rupeesToPaisa(20000),
      tenantName: 'Tenant A',
      notes: 'Demo tenant',
      updatedAt: nowISO(),
    })
  }
  if (village) {
    await db.properties.update(village.id, {
      monthlyRentExpected: rupeesToPaisa(10000),
      tenantName: 'Village tenant',
      updatedAt: nowISO(),
    })
  }
}

export async function deleteDemoData() {
  const tables = [
    db.people,
    db.properties,
    db.templates,
    db.incomes,
    db.receipts,
    db.expenses,
    db.bills,
    db.loans,
    db.repayments,
  ] as const
  for (const table of tables) {
    const rows = await table.toArray()
    for (const row of rows) {
      if ('isDemo' in row && row.isDemo) {
        await table.update(row.id, { deletedAt: nowISO(), updatedAt: nowISO() })
      }
    }
  }
  const settings = await db.settings.get('app')
  if (settings) await db.settings.put({ ...settings, demoLoaded: false })
}

export function personByName(people: Person[], name: string) {
  return people.find((p) => p.name.toLowerCase() === name.toLowerCase())
}

export function houseByName(houses: Property[], name: string) {
  return houses.find((p) => p.name.toLowerCase().includes(name.toLowerCase()))
}
