import { Badge } from '@/components/ui/card'

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: 'ok' | 'pending' | 'warn' | 'overdue' | 'neutral'; label: string }> = {
    received: { tone: 'ok', label: 'Received' },
    paid: { tone: 'ok', label: 'Paid' },
    pending: { tone: 'pending', label: 'Pending' },
    partial: { tone: 'warn', label: 'Partially received' },
    unpaid: { tone: 'pending', label: 'Unpaid' },
    upcoming: { tone: 'neutral', label: 'Upcoming' },
    due: { tone: 'warn', label: 'Due' },
    overdue: { tone: 'overdue', label: 'Overdue' },
  }
  const v = map[status] ?? { tone: 'neutral' as const, label: status }
  return <Badge tone={v.tone}>{v.label}</Badge>
}
