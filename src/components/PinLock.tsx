import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { verifyPin } from '@/lib/pin'

export function PinLock({ hash, onUnlock }: { hash: string; onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (await verifyPin(pin, hash)) onUnlock()
    else setError('Wrong PIN. Try again.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6 text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Family Finance</h1>
        <p className="text-slate-300">Enter your PIN to open the app. Backup still works after you unlock.</p>
        <Input
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="text-slate-900"
        />
        {error ? <p className="text-red-300">{error}</p> : null}
        <Button type="submit" className="w-full">
          Unlock
        </Button>
      </form>
    </div>
  )
}
