export const DEFAULT_PEOPLE = [
  { id: 'person-father', name: 'Father' },
  { id: 'person-mother', name: 'Mother' },
  { id: 'person-me', name: 'Me' },
  { id: 'person-shivam', name: 'Shivam' },
  { id: 'person-sister', name: 'Sister' },
  { id: 'person-family', name: 'Family' },
  { id: 'person-other', name: 'Other' },
] as const

export const DEFAULT_PROPERTIES = [
  { id: 'house-kathmandu', name: 'Kathmandu House', location: 'Kathmandu' },
  { id: 'house-village', name: 'Village House', location: 'Village' },
] as const

export const DEFAULT_CATEGORIES = [
  { id: 'cat-salary', name: 'Salary', kind: 'income' as const, isDefault: true },
  { id: 'cat-rent-in', name: 'Rent Income', kind: 'income' as const, isDefault: true },
  { id: 'cat-other-in', name: 'Other Income', kind: 'income' as const, isDefault: true },
  { id: 'cat-food', name: 'Food', kind: 'expense' as const, isDefault: true },
  { id: 'cat-electricity', name: 'Electricity', kind: 'expense' as const, isDefault: true },
  { id: 'cat-water', name: 'Water', kind: 'expense' as const, isDefault: true },
  { id: 'cat-internet', name: 'Internet', kind: 'expense' as const, isDefault: true },
  { id: 'cat-gas', name: 'Gas', kind: 'expense' as const, isDefault: true },
  { id: 'cat-education', name: 'Education', kind: 'expense' as const, isDefault: true },
  { id: 'cat-transport', name: 'Transportation', kind: 'expense' as const, isDefault: true },
  { id: 'cat-medical', name: 'Medical', kind: 'expense' as const, isDefault: true },
  { id: 'cat-maintenance', name: 'House Maintenance', kind: 'expense' as const, isDefault: true },
  { id: 'cat-rent', name: 'Rent', kind: 'expense' as const, isDefault: true },
  { id: 'cat-loan-repay', name: 'Loan Repayment', kind: 'expense' as const, isDefault: true },
  { id: 'cat-money-given', name: 'Money Given', kind: 'expense' as const, isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', kind: 'expense' as const, isDefault: true },
  { id: 'cat-clothing', name: 'Clothing', kind: 'expense' as const, isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', kind: 'expense' as const, isDefault: true },
  { id: 'cat-phone', name: 'Mobile/Phone', kind: 'expense' as const, isDefault: true },
  { id: 'cat-gov', name: 'Government/Official', kind: 'expense' as const, isDefault: true },
  { id: 'cat-other', name: 'Other', kind: 'expense' as const, isDefault: true },
]

export const INCOME_FREQUENCIES = [
  { value: 'one-time', label: 'One time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const
