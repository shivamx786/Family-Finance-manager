import Dexie, { type EntityTable } from 'dexie'
import { DEFAULT_CATEGORIES } from '@/lib/defaults'
import { nowISO } from '@/lib/ids'
import type {
  AppSettings,
  AuditLog,
  BillRecord,
  Category,
  ExpenseRecord,
  IncomeReceipt,
  IncomeRecord,
  LoanRecord,
  LoanRepayment,
  Person,
  Property,
  RecurrenceTemplate,
} from '@/types'

export class FinanceDB extends Dexie {
  people!: EntityTable<Person, 'id'>
  properties!: EntityTable<Property, 'id'>
  categories!: EntityTable<Category, 'id'>
  templates!: EntityTable<RecurrenceTemplate, 'id'>
  incomes!: EntityTable<IncomeRecord, 'id'>
  receipts!: EntityTable<IncomeReceipt, 'id'>
  expenses!: EntityTable<ExpenseRecord, 'id'>
  bills!: EntityTable<BillRecord, 'id'>
  loans!: EntityTable<LoanRecord, 'id'>
  repayments!: EntityTable<LoanRepayment, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  auditLogs!: EntityTable<AuditLog, 'id'>

  constructor() {
    super('family-finance')
    this.version(1).stores({
      people: 'id, name, deletedAt',
      properties: 'id, name, deletedAt',
      categories: 'id, name, kind',
      templates: 'id, kind, active, periodKey',
      incomes: 'id, expectedDate, status, templateId, periodKey, deletedAt, [templateId+periodKey]',
      receipts: 'id, incomeId, date, deletedAt',
      expenses: 'id, date, status, billId, categoryId, personId, propertyId, deletedAt',
      bills: 'id, dueDate, templateId, periodKey, linkedExpenseId, deletedAt, [templateId+periodKey]',
      loans: 'id, direction, date, deletedAt',
      repayments: 'id, loanId, date, deletedAt',
      settings: 'id',
      auditLogs: 'id, at, entityType',
    })
  }
}

export const db = new FinanceDB()

export async function ensureDefaults() {
  const existing = await db.settings.get('app')
  if (!existing) {
    await db.settings.put({
      id: 'app',
      setupComplete: false,
      currencySymbol: 'Rs.',
      theme: 'system',
      demoLoaded: false,
    })
  }
  const catCount = await db.categories.count()
  if (catCount === 0) {
    const ts = nowISO()
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        createdAt: ts,
        updatedAt: ts,
      })),
    )
  }
}

export function alive<T extends { deletedAt?: string }>(rows: T[]): T[] {
  return rows.filter((r) => !r.deletedAt)
}
