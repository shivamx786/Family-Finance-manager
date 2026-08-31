export type Frequency = 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type IncomeStatus = 'pending' | 'received' | 'partial'
export type ExpenseStatus = 'paid' | 'unpaid'
export type LoanDirection = 'we_owe' | 'they_owe'
export type ThemeMode = 'light' | 'dark' | 'system'
export type TemplateKind = 'income' | 'bill'

export interface Timestamps {
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Person extends Timestamps {
  id: string
  name: string
  isDefault?: boolean
  isDemo?: boolean
  notes?: string
}

export interface Property extends Timestamps {
  id: string
  name: string
  location?: string
  monthlyRentExpected: number
  tenantName?: string
  tenantNotes?: string
  notes?: string
  isDemo?: boolean
}

export interface Category extends Timestamps {
  id: string
  name: string
  kind: 'income' | 'expense' | 'both'
  isDefault?: boolean
}

export interface RecurrenceTemplate extends Timestamps {
  id: string
  kind: TemplateKind
  name: string
  amount: number
  frequency: Frequency
  expectedDay: number
  personId?: string
  propertyId?: string
  categoryId?: string
  notes?: string
  startDate: string
  endDate?: string
  active: boolean
  isDemo?: boolean
}

export interface IncomeRecord extends Timestamps {
  id: string
  name: string
  personId?: string
  propertyId?: string
  categoryId?: string
  expectedAmount: number
  expectedDate: string
  receivedDate?: string
  frequency: Frequency
  templateId?: string
  periodKey?: string
  status: IncomeStatus
  notes?: string
  isDemo?: boolean
}

export interface IncomeReceipt extends Timestamps {
  id: string
  incomeId: string
  amount: number
  date: string
  notes?: string
  isDemo?: boolean
}

export interface ExpenseRecord extends Timestamps {
  id: string
  amount: number
  categoryId?: string
  personId?: string
  propertyId?: string
  date: string
  paidDate?: string
  status: ExpenseStatus
  notes?: string
  billId?: string
  loanId?: string
  isDemo?: boolean
}

export interface BillRecord extends Timestamps {
  id: string
  name: string
  categoryId?: string
  amount: number
  dueDate: string
  frequency: Frequency
  personId?: string
  propertyId?: string
  notes?: string
  paidDate?: string
  linkedExpenseId?: string
  templateId?: string
  periodKey?: string
  isDemo?: boolean
}

export interface LoanRecord extends Timestamps {
  id: string
  direction: LoanDirection
  personId?: string
  personName?: string
  originalAmount: number
  date: string
  dueDate?: string
  description: string
  notes?: string
  isDemo?: boolean
}

export interface LoanRepayment extends Timestamps {
  id: string
  loanId: string
  amount: number
  date: string
  notes?: string
  isDemo?: boolean
}

export interface AuditLog {
  id: string
  at: string
  action: string
  entityType: string
  entityId: string
  snapshot?: string
}

export interface AppSettings {
  id: 'app'
  setupComplete: boolean
  currencySymbol: string
  theme: ThemeMode
  pinHash?: string
  demoLoaded: boolean
  familyName?: string
}

export interface BackupFile {
  app: 'family-finance'
  version: 1
  exportedAt: string
  data: {
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
    settings: AppSettings[]
    auditLogs?: AuditLog[]
  }
}
