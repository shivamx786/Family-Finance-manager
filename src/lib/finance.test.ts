import { describe, expect, it } from 'vitest'
import { incomeStatus, loanRemaining, monthSnapshot } from '@/lib/finance'
import { remainingOf, rupeesToPaisa } from '@/lib/money'
import type { BillRecord, ExpenseRecord, IncomeReceipt, IncomeRecord, LoanRecord, LoanRepayment } from '@/types'

const ts = { createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' }

function income(partial: Partial<IncomeRecord> & Pick<IncomeRecord, 'id' | 'expectedAmount' | 'expectedDate'>): IncomeRecord {
  return {
    name: 'Item',
    frequency: 'monthly',
    status: 'pending',
    ...ts,
    ...partial,
  }
}

describe('money', () => {
  it('stores rupees as integer paisa', () => {
    expect(rupeesToPaisa(45000)).toBe(4_500_000)
    expect(remainingOf(2_000_000, 1_200_000)).toBe(800_000)
  })
})

describe('scenario 1 — salary received', () => {
  const salary = income({
    id: 'sal',
    name: "Father's Salary",
    expectedAmount: rupeesToPaisa(45000),
    expectedDate: '2026-08-31',
    status: 'pending',
  })

  it('before receiving: actual 0, pending 45,000', () => {
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [salary],
      receipts: [],
      expenses: [],
      bills: [],
      loans: [],
      repayments: [],
    })
    expect(snap.receivedIncome).toBe(0)
    expect(snap.pendingIncome).toBe(rupeesToPaisa(45000))
  })

  it('after received: actual 45,000, pending 0', () => {
    const receipts: IncomeReceipt[] = [
      { id: 'r1', incomeId: 'sal', amount: rupeesToPaisa(45000), date: '2026-08-31', ...ts },
    ]
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [{ ...salary, status: 'received' }],
      receipts,
      expenses: [],
      bills: [],
      loans: [],
      repayments: [],
    })
    expect(snap.receivedIncome).toBe(rupeesToPaisa(45000))
    expect(snap.pendingIncome).toBe(0)
    expect(incomeStatus(salary.expectedAmount, rupeesToPaisa(45000))).toBe('received')
  })
})

describe('scenario 2 — partial rent', () => {
  it('received 12,000 pending 8,000', () => {
    const rent = income({
      id: 'rent',
      name: 'Kathmandu House Rent',
      expectedAmount: rupeesToPaisa(20000),
      expectedDate: '2026-08-30',
      status: 'partial',
    })
    const receipts: IncomeReceipt[] = [
      { id: 'r', incomeId: 'rent', amount: rupeesToPaisa(12000), date: '2026-08-20', ...ts },
    ]
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [rent],
      receipts,
      expenses: [],
      bills: [],
      loans: [],
      repayments: [],
    })
    expect(snap.receivedIncome).toBe(rupeesToPaisa(12000))
    expect(snap.pendingIncome).toBe(rupeesToPaisa(8000))
  })
})

describe('scenario 3 — unpaid electricity', () => {
  const bill: BillRecord = {
    id: 'el',
    name: 'Electricity',
    amount: rupeesToPaisa(3000),
    dueDate: '2026-08-28',
    frequency: 'monthly',
    ...ts,
  }
  const incomeRow = income({
    id: 'i',
    expectedAmount: rupeesToPaisa(10000),
    expectedDate: '2026-08-01',
    status: 'received',
  })
  const receipts: IncomeReceipt[] = [
    { id: 'r', incomeId: 'i', amount: rupeesToPaisa(10000), date: '2026-08-01', ...ts },
  ]

  it('unpaid bill does not reduce actual balance', () => {
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [incomeRow],
      receipts,
      expenses: [],
      bills: [bill],
      loans: [],
      repayments: [],
    })
    expect(snap.remainingBalance).toBe(rupeesToPaisa(10000))
    expect(snap.pendingExpenses).toBe(rupeesToPaisa(3000))
  })

  it('after paid, actual balance decreases by 3,000', () => {
    const expense: ExpenseRecord = {
      id: 'e',
      amount: rupeesToPaisa(3000),
      date: '2026-08-28',
      paidDate: '2026-08-28',
      status: 'paid',
      billId: 'el',
      ...ts,
    }
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [incomeRow],
      receipts,
      expenses: [expense],
      bills: [{ ...bill, linkedExpenseId: 'e', paidDate: '2026-08-28' }],
      loans: [],
      repayments: [],
    })
    expect(snap.remainingBalance).toBe(rupeesToPaisa(7000))
  })
})

describe('scenario 4 — loan borrowed', () => {
  it('borrowed principal is not income; remaining updates on repayment', () => {
    const loan: LoanRecord = {
      id: 'l',
      direction: 'we_owe',
      originalAmount: rupeesToPaisa(50000),
      date: '2026-08-01',
      description: 'Borrowed',
      ...ts,
    }
    const repayments: LoanRepayment[] = [
      { id: 'p', loanId: 'l', amount: rupeesToPaisa(10000), date: '2026-08-10', ...ts },
    ]
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [],
      receipts: [],
      expenses: [],
      bills: [],
      loans: [loan],
      repayments,
    })
    expect(snap.receivedIncome).toBe(0)
    expect(snap.weOwe).toBe(rupeesToPaisa(40000))
    expect(loanRemaining(loan, repayments)).toBe(rupeesToPaisa(40000))
  })
})

describe('scenario 5 — money lent', () => {
  it('return of principal is not income', () => {
    const loan: LoanRecord = {
      id: 'l',
      direction: 'they_owe',
      originalAmount: rupeesToPaisa(20000),
      date: '2026-08-01',
      description: 'Lent',
      ...ts,
    }
    const repayments: LoanRepayment[] = [
      { id: 'p', loanId: 'l', amount: rupeesToPaisa(5000), date: '2026-08-10', ...ts },
    ]
    const snap = monthSnapshot({
      year: 2026,
      monthIndex: 7,
      incomes: [],
      receipts: [],
      expenses: [],
      bills: [],
      loans: [loan],
      repayments,
    })
    expect(snap.receivedIncome).toBe(0)
    expect(snap.theyOwe).toBe(rupeesToPaisa(15000))
  })
})
