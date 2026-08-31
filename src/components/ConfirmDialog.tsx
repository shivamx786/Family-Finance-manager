import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div role="dialog" className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{body}</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
