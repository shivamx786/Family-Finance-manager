import { LayoutDashboard, Receipt, Wallet, FileText, Menu, Search } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'

const tabs = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/income', label: 'Income', icon: Wallet },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/more', label: 'More', icon: Menu },
]

export function Layout() {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/setup')
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-[var(--color-surface)]">
      {!hideNav ? (
        <div className="flex justify-end px-3 pt-3">
          <NavLink
            to="/search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900"
            aria-label="Search"
          >
            <Search size={20} />
          </NavLink>
        </div>
      ) : null}
      <main className={cn('flex-1 px-4 pb-24 pt-2', hideNav && 'pb-8')}>
        <Outlet />
      </main>
      {!hideNav ? (
        <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs',
                    isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500',
                  )
                }
              >
                <t.icon size={22} />
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
