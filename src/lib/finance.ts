import { inMonth, inRange, isDueThisWeek, isDueToday, isOverdue, type DateRange } from '@/lib/dates'
import { remainingOf } from '@/lib/money'
import type {
  BillRecord,
  ExpenseRecord,
  IncomeReceipt,
  IncomeRecord,
  LoanRecord,
  LoanRepayment,
  Property,
} from '@/types'

export function receivedTotal(incomeId: string, receipts: IncomeReceipt[]): number {
  return receipts.filter((r) => r.incomeId === incomeId && !r.deletedAt).reduce((s, r) => s + r.amount, 0)
}

export function incomeStatus(expected: number, received: number): 'pending' | 'partial' | 'received' {
  if (received <= 0) return 'pending'
  if (received >= expected) return 'received'
  return 'partial'
}

export function loanRemaining(loan: LoanRecord, repayments: LoanRepayment[]): number {
  const repaid = repayments.filter((r) => r.loanId === loan.id && !r.deletedAt).reduce((s, r) => s + r.amount, 0)
  return remainingOf(loan.originalAmount, repaid)
}

export function monthSnapshot(opts: {
  year: number
  monthIndex: number
  incomes: IncomeRecord[]
  receipts: IncomeReceipt[]
  expenses: ExpenseRecord[]
  bills: BillRecord[]
  loans: LoanRecord[]
  repayments: LoanRepayment[]
}) {
  const { year, monthIndex, incomes, receipts, expenses, bills, loans, repayments } = opts
  const liveIncomes = incomes.filter((i) => !i.deletedAt)
  const liveReceipts = receipts.filter((r) => !r.deletedAt)
  const liveExpenses = expenses.filter((e) => !e.deletedAt)
  const liveBills = bills.filter((b) => !b.deletedAt)

  const receivedIncome = liveReceipts
    .filter((r) => inMonth(r.date, year, monthIndex))
    .reduce((s, r) => s + r.amount, 0)

  const monthIncomes = liveIncomes.filter((i) => inMonth(i.expectedDate, year, monthIndex))
  const pendingIncome = monthIncomes.reduce((s, i) => {
    const rec = receivedTotal(i.id, liveReceipts)
    return s + remainingOf(i.expectedAmount, rec)
  }, 0)
  const expectedIncome = monthIncomes.reduce((s, i) => s + i.expectedAmount, 0)

  const paidExpenses = liveExpenses
    .filter((e) => e.status === 'paid' && inMonth(e.paidDate ?? e.date, year, monthIndex))
    .reduce((s, e) => s + e.amount, 0)

  const unpaidExpenses = liveExpenses
    .filter((e) => e.status === 'unpaid' && inMonth(e.date, year, monthIndex))
    .reduce((s, e) => s + e.amount, 0)

  const unpaidBills = liveBills
    .filter((b) => !b.linkedExpenseId && inMonth(b.dueDate, year, monthIndex))
    .reduce((s, b) => s + b.amount, 0)

  const pendingExpenses = unpaidExpenses + unpaidBills
  const remainingBalance = receivedIncome - paidExpenses
  const expectedBalance = remainingBalance + pendingIncome - pendingExpenses

  const weOwe = loans
    .filter((l) => !l.deletedAt && l.direction === 'we_owe')
    .reduce((s, l) => s + loanRemaining(l, repayments), 0)
  const theyOwe = loans
    .filter((l) => !l.deletedAt && l.direction === 'they_owe')
    .reduce((s, l) => s + loanRemaining(l, repayments), 0)

  return {
    receivedIncome,
    pendingIncome,
    expectedIncome,
    paidExpenses,
    pendingExpenses,
    remainingBalance,
    expectedBalance,
    weOwe,
    theyOwe,
  }
}

export type DueKind = 'today' | 'week' | 'overdue'

export interface DueItem {
  id: string
  type: 'bill' | 'expense' | 'loan'
  name: string
  amount: number
  dueDate: string
  kind: DueKind
  billId?: string
  expenseId?: string
  loanId?: string
}

export function dueItems(opts: {
  bills: BillRecord[]
  expenses: ExpenseRecord[]
  loans: LoanRecord[]
  repayments: LoanRepayment[]
}): DueItem[] {
  const items: DueItem[] = []
  for (const b of opts.bills.filter((b) => !b.deletedAt && !b.linkedExpenseId)) {
    const kind: DueKind | null = isOverdue(b.dueDate)
      ? 'overdue'
      : isDueToday(b.dueDate)
        ? 'today'
        : isDueThisWeek(b.dueDate)
          ? 'week'
          : null
    if (!kind) continue
    items.push({ id: `bill-${b.id}`, type: 'bill', name: b.name, amount: b.amount, dueDate: b.dueDate, kind, billId: b.id })
  }
  for (const e of opts.expenses.filter((e) => !e.deletedAt && e.status === 'unpaid')) {
    const kind: DueKind | null = isOverdue(e.date)
      ? 'overdue'
      : isDueToday(e.date)
        ? 'today'
        : isDueThisWeek(e.date)
          ? 'week'
          : null
    if (!kind) continue
    items.push({
      id: `exp-${e.id}`,
      type: 'expense',
      name: e.notes || 'Unpaid expense',
      amount: e.amount,
      dueDate: e.date,
      kind,
      expenseId: e.id,
    })
  }
  for (const l of opts.loans.filter((l) => !l.deletedAt && l.dueDate && loanRemaining(l, opts.repayments) > 0)) {
    const due = l.dueDate!
    const kind: DueKind | null = isOverdue(due) ? 'overdue' : isDueToday(due) ? 'today' : isDueThisWeek(due) ? 'week' : null
    if (!kind) continue
    items.push({
      id: `loan-${l.id}`,
      type: 'loan',
      name: l.description,
      amount: loanRemaining(l, opts.repayments),
      dueDate: due,
      kind,
      loanId: l.id,
    })
  }
  const order = { overdue: 0, today: 1, week: 2 }
  return items.sort((a, b) => order[a.kind] - order[b.kind] || a.dueDate.localeCompare(b.dueDate))
}

export function billDisplayStatus(bill: BillRecord): 'upcoming' | 'due' | 'paid' | 'overdue' {
  if (bill.linkedExpenseId || bill.paidDate) return 'paid'
  if (isOverdue(bill.dueDate)) return 'overdue'
  if (isDueToday(bill.dueDate) || isDueThisWeek(bill.dueDate)) return 'due'
  return 'upcoming'
}

export function propertyCashFlow(
  property: Property,
  year: number,
  monthIndex: number,
  incomes: IncomeRecord[],
  receipts: IncomeReceipt[],
  expenses: ExpenseRecord[],
) {
  const propIncomes = incomes.filter((i) => !i.deletedAt && i.propertyId === property.id)
  const received = receipts
    .filter((r) => !r.deletedAt && propIncomes.some((i) => i.id === r.incomeId) && inMonth(r.date, year, monthIndex))
    .reduce((s, r) => s + r.amount, 0)
  const spent = expenses
    .filter(
      (e) =>
        !e.deletedAt &&
        e.propertyId === property.id &&
        e.status === 'paid' &&
        inMonth(e.paidDate ?? e.date, year, monthIndex),
    )
    .reduce((s, e) => s + e.amount, 0)
  return { received, spent, net: received - spent }
}

export function breakdown(
  rows: { name: string; amount: number }[],
): { name: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) map.set(r.name, (map.get(r.name) ?? 0) + r.amount)
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function rangeIncome(incomes: IncomeRecord[], receipts: IncomeReceipt[], range: DateRange) {
  const rec = receipts.filter((r) => !r.deletedAt && inRange(r.date, range))
  return rec.reduce((s, r) => s + r.amount, 0)
}

export function rangeExpenses(expenses: ExpenseRecord[], range: DateRange) {
  return expenses
    .filter((e) => !e.deletedAt && e.status === 'paid' && inRange(e.paidDate ?? e.date, range))
    .reduce((s, e) => s + e.amount, 0)
}
