import { db } from '@/db/database'
import { todayISO } from '@/lib/dates'
import { billDisplayStatus } from '@/lib/finance'
import { incomeStatus, receivedTotal } from '@/lib/finance'
import { newId, nowISO, stamp, touch } from '@/lib/ids'
import { remainingOf } from '@/lib/money'
import type { BillRecord, ExpenseRecord, Frequency, IncomeRecord, LoanDirection } from '@/types'

async function audit(action: string, entityType: string, entityId: string, snapshot?: unknown) {
  await db.auditLogs.add({
    id: newId(),
    at: nowISO(),
    action,
    entityType,
    entityId,
    snapshot: snapshot ? JSON.stringify(snapshot) : undefined,
  })
}

export async function addIncome(input: {
  name: string
  personId?: string
  propertyId?: string
  categoryId?: string
  expectedAmount: number
  expectedDate: string
  frequency: Frequency
  notes?: string
  createTemplate?: boolean
}) {
  const id = newId()
  const record: IncomeRecord = {
    id,
    name: input.name,
    personId: input.personId,
    propertyId: input.propertyId,
    categoryId: input.categoryId,
    expectedAmount: input.expectedAmount,
    expectedDate: input.expectedDate,
    frequency: input.frequency,
    status: 'pending',
    notes: input.notes,
    ...stamp(),
  }
  if (input.createTemplate && input.frequency !== 'one-time') {
    const templateId = newId()
    const day = Number(input.expectedDate.slice(8, 10))
    await db.templates.add({
      id: templateId,
      kind: 'income',
      name: input.name,
      amount: input.expectedAmount,
      frequency: input.frequency,
      expectedDay: day,
      personId: input.personId,
      propertyId: input.propertyId,
      categoryId: input.categoryId,
      notes: input.notes,
      startDate: input.expectedDate,
      active: true,
      ...stamp(),
    })
    record.templateId = templateId
    record.periodKey = input.expectedDate.slice(0, 7)
  }
  await db.incomes.add(record)
  return id
}

export async function recordIncomeReceipt(incomeId: string, amount: number, date: string, notes?: string) {
  const income = await db.incomes.get(incomeId)
  if (!income || income.deletedAt) throw new Error('Income not found')
  const receipts = await db.receipts.where('incomeId').equals(incomeId).toArray()
  const already = receivedTotal(incomeId, receipts)
  const remaining = remainingOf(income.expectedAmount, already)
  if (amount > remaining) throw new Error('Amount is more than remaining')
  await db.receipts.add({
    id: newId(),
    incomeId,
    amount,
    date,
    notes,
    ...stamp(),
  })
  const nextReceived = already + amount
  const status = incomeStatus(income.expectedAmount, nextReceived)
  await db.incomes.update(incomeId, {
    status,
    receivedDate: status === 'received' ? date : income.receivedDate,
    updatedAt: nowISO(),
  })
}

export async function markIncomeReceived(incomeId: string, date = todayISO()) {
  const income = await db.incomes.get(incomeId)
  if (!income || income.deletedAt) throw new Error('Income not found')
  const receipts = await db.receipts.where('incomeId').equals(incomeId).toArray()
  const remaining = remainingOf(income.expectedAmount, receivedTotal(incomeId, receipts))
  if (remaining <= 0) return
  await recordIncomeReceipt(incomeId, remaining, date)
}

export async function addExpense(input: {
  amount: number
  categoryId?: string
  personId?: string
  propertyId?: string
  date: string
  status: 'paid' | 'unpaid'
  notes?: string
  billId?: string
  loanId?: string
}) {
  const rec: ExpenseRecord = {
    id: newId(),
    amount: input.amount,
    categoryId: input.categoryId,
    personId: input.personId,
    propertyId: input.propertyId,
    date: input.date,
    status: input.status,
    notes: input.notes,
    billId: input.billId,
    loanId: input.loanId,
    paidDate: input.status === 'paid' ? input.date : undefined,
    ...stamp(),
  }
  await db.expenses.add(rec)
  return rec.id
}

export async function markExpensePaid(expenseId: string, date = todayISO()) {
  const e = await db.expenses.get(expenseId)
  if (!e || e.deletedAt) throw new Error('Expense not found')
  await db.expenses.update(expenseId, { status: 'paid', paidDate: date, updatedAt: nowISO() })
}

export async function addBill(input: {
  name: string
  categoryId?: string
  amount: number
  dueDate: string
  frequency: Frequency
  personId?: string
  propertyId?: string
  notes?: string
  createTemplate?: boolean
}) {
  let templateId: string | undefined
  if (input.createTemplate && input.frequency !== 'one-time') {
    templateId = newId()
    await db.templates.add({
      id: templateId,
      kind: 'bill',
      name: input.name,
      amount: input.amount,
      frequency: input.frequency,
      expectedDay: Number(input.dueDate.slice(8, 10)),
      personId: input.personId,
      propertyId: input.propertyId,
      categoryId: input.categoryId,
      notes: input.notes,
      startDate: input.dueDate,
      active: true,
      ...stamp(),
    })
  }
  const id = newId()
  await db.bills.add({
    id,
    name: input.name,
    categoryId: input.categoryId,
    amount: input.amount,
    dueDate: input.dueDate,
    frequency: input.frequency,
    personId: input.personId,
    propertyId: input.propertyId,
    notes: input.notes,
    templateId,
    periodKey: templateId ? input.dueDate.slice(0, 7) : undefined,
    ...stamp(),
  })
  return id
}

export async function markBillPaid(billId: string, date = todayISO()) {
  const bill = await db.bills.get(billId)
  if (!bill || bill.deletedAt) throw new Error('Bill not found')
  if (bill.linkedExpenseId) return bill.linkedExpenseId
  const expenseId = await addExpense({
    amount: bill.amount,
    categoryId: bill.categoryId,
    personId: bill.personId,
    propertyId: bill.propertyId,
    date,
    status: 'paid',
    notes: bill.notes || bill.name,
    billId: bill.id,
  })
  await db.bills.update(billId, { paidDate: date, linkedExpenseId: expenseId, updatedAt: nowISO() })
  return expenseId
}

export function displayBillStatus(bill: BillRecord) {
  return billDisplayStatus(bill)
}

export async function addLoan(input: {
  direction: LoanDirection
  personId?: string
  personName?: string
  originalAmount: number
  date: string
  dueDate?: string
  description: string
  notes?: string
}) {
  const id = newId()
  await db.loans.add({
    id,
    direction: input.direction,
    personId: input.personId,
    personName: input.personName,
    originalAmount: input.originalAmount,
    date: input.date,
    dueDate: input.dueDate,
    description: input.description,
    notes: input.notes,
    ...stamp(),
  })
  return id
}

export async function recordLoanRepayment(loanId: string, amount: number, date: string, notes?: string) {
  const loan = await db.loans.get(loanId)
  if (!loan || loan.deletedAt) throw new Error('Loan not found')
  const reps = await db.repayments.where('loanId').equals(loanId).toArray()
  const remaining = remainingOf(
    loan.originalAmount,
    reps.filter((r) => !r.deletedAt).reduce((s, r) => s + r.amount, 0),
  )
  if (amount > remaining) throw new Error('Amount is more than remaining')
  await db.repayments.add({ id: newId(), loanId, amount, date, notes, ...stamp() })
}

export async function softDelete(table: 'incomes' | 'expenses' | 'bills' | 'loans' | 'people' | 'properties' | 'receipts' | 'repayments' | 'templates', id: string) {
  const row = await db.table(table).get(id)
  if (!row) return
  await audit('soft-delete', table, id, row)
  await db.table(table).update(id, { deletedAt: nowISO(), updatedAt: nowISO() })
}

export async function addPerson(name: string, notes?: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')
  const exists = (await db.people.toArray()).some((p) => !p.deletedAt && p.name.toLowerCase() === trimmed.toLowerCase())
  if (exists) throw new Error('A person with this name already exists')
  const id = newId()
  await db.people.add({ id, name: trimmed, notes, isDefault: false, ...stamp() })
  return id
}

export async function addProperty(input: {
  name: string
  location?: string
  monthlyRentExpected: number
  tenantName?: string
  tenantNotes?: string
  notes?: string
}) {
  const id = newId()
  await db.properties.add({ id, ...input, ...stamp() })
  return id
}

export async function addCategory(name: string, kind: 'income' | 'expense' | 'both' = 'expense') {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Category name is required')
  const exists = (await db.categories.toArray()).some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  if (exists) throw new Error('This category already exists')
  const id = newId()
  await db.categories.add({ id, name: trimmed, kind, ...stamp() })
  return id
}

export async function updateSettings(patch: Partial<import('@/types').AppSettings>) {
  const cur = await db.settings.get('app')
  if (!cur) return
  await db.settings.put({ ...cur, ...patch })
}
