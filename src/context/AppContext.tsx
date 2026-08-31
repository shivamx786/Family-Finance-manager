import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureDefaults } from '@/db/database'
import { generateRecurringForMonth } from '@/lib/recurrence'
import { pinSessionKey } from '@/lib/pin'
import type {
  AppSettings,
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

type Month = { year: number; monthIndex: number }

type Ctx = {
  ready: boolean
  settings: AppSettings | undefined
  people: Person[]
  properties: Property[]
  categories: Category[]
  templates: RecurrenceTemplate[]
  incomes: IncomeRecord[]
  receipts: IncomeReceipt[]
  expenses: ExpenseRecord[]
  bills: BillRecord[]
  loans: LoanRecord[]
  repayments: LoanRepayment[]
  month: Month
  setMonth: (m: Month) => void
  symbol: string
  locked: boolean
  unlock: () => void
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState<Month>({ year: now.getFullYear(), monthIndex: now.getMonth() })
  const [locked, setLocked] = useState(false)

  const settings = useLiveQuery(() => db.settings.get('app'))
  const people = useLiveQuery(() => db.people.toArray()) ?? []
  const properties = useLiveQuery(() => db.properties.toArray()) ?? []
  const categories = useLiveQuery(() => db.categories.toArray()) ?? []
  const templates = useLiveQuery(() => db.templates.toArray()) ?? []
  const incomes = useLiveQuery(() => db.incomes.toArray()) ?? []
  const receipts = useLiveQuery(() => db.receipts.toArray()) ?? []
  const expenses = useLiveQuery(() => db.expenses.toArray()) ?? []
  const bills = useLiveQuery(() => db.bills.toArray()) ?? []
  const loans = useLiveQuery(() => db.loans.toArray()) ?? []
  const repayments = useLiveQuery(() => db.repayments.toArray()) ?? []

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureDefaults()
      const s = await db.settings.get('app')
      if (s?.pinHash && sessionStorage.getItem(pinSessionKey()) !== '1') setLocked(true)
      const d = new Date()
      await generateRecurringForMonth(d.getFullYear(), d.getMonth())
      const next = d.getMonth() === 11 ? { y: d.getFullYear() + 1, m: 0 } : { y: d.getFullYear(), m: d.getMonth() + 1 }
      await generateRecurringForMonth(next.y, next.m)
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void generateRecurringForMonth(month.year, month.monthIndex)
  }, [ready, month.year, month.monthIndex])

  useEffect(() => {
    const root = document.documentElement
    const theme = settings?.theme ?? 'system'
    const apply = (dark: boolean) => root.classList.toggle('dark', dark)
    if (theme === 'dark') apply(true)
    else if (theme === 'light') apply(false)
    else apply(window.matchMedia('(prefers-color-scheme: dark)').matches)
  }, [settings?.theme])

  const value = useMemo(
    () => ({
      ready,
      settings,
      people: people.filter((p) => !p.deletedAt),
      properties: properties.filter((p) => !p.deletedAt),
      categories,
      templates: templates.filter((t) => !t.deletedAt),
      incomes: incomes.filter((i) => !i.deletedAt),
      receipts: receipts.filter((r) => !r.deletedAt),
      expenses: expenses.filter((e) => !e.deletedAt),
      bills: bills.filter((b) => !b.deletedAt),
      loans: loans.filter((l) => !l.deletedAt),
      repayments: repayments.filter((r) => !r.deletedAt),
      month,
      setMonth,
      symbol: settings?.currencySymbol ?? 'Rs.',
      locked,
      unlock: () => {
        sessionStorage.setItem(pinSessionKey(), '1')
        setLocked(false)
      },
    }),
    [ready, settings, people, properties, categories, templates, incomes, receipts, expenses, bills, loans, repayments, month, locked],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
