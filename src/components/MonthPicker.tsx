import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { monthLabel } from '@/lib/dates'

export function MonthPicker({
  year,
  monthIndex,
  onChange,
}: {
  year: number
  monthIndex: number
  onChange: (year: number, monthIndex: number) => void
}) {
  const prev = () => {
    if (monthIndex === 0) onChange(year - 1, 11)
    else onChange(year, monthIndex - 1)
  }
  const next = () => {
    if (monthIndex === 11) onChange(year + 1, 0)
    else onChange(year, monthIndex + 1)
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" aria-label="Previous month" onClick={prev}>
        <ChevronLeft />
      </Button>
      <h1 className="text-lg font-semibold">{monthLabel(year, monthIndex)}</h1>
      <Button variant="ghost" size="sm" aria-label="Next month" onClick={next}>
        <ChevronRight />
      </Button>
    </div>
  )
}
