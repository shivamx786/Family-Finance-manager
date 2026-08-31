import { formatMoney } from '@/lib/money'

export function Money({ paisa, symbol, className }: { paisa: number; symbol: string; className?: string }) {
  return <span className={className}>{formatMoney(paisa, symbol)}</span>
}
