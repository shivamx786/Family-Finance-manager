import { cn } from '@/lib/cn'

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:text-slate-100', className)}>
      {children}
    </div>
  )
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'ok' | 'pending' | 'warn' | 'overdue'
  children: React.ReactNode
}) {
  const map = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    warn: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', map[tone])}>{children}</span>
}
