/** Amounts are stored as integer paisa (1 NPR = 100 paisa) to avoid float errors. */

export const PAISA_PER_RUPEE = 100

export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * PAISA_PER_RUPEE)
}

export function parseAmountInput(
  raw: string,
): { ok: true; paisa: number } | { ok: false; error: string } {
  const cleaned = raw.replace(/,/g, '').replace(/Rs\.?/gi, '').replace(/\s/g, '').trim()
  if (!cleaned) return { ok: false, error: 'Enter an amount' }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, error: 'Enter a valid amount (no negative numbers)' }
  }
  const [whole, frac = ''] = cleaned.split('.')
  const paisa = Number(whole) * PAISA_PER_RUPEE + Number(frac.padEnd(2, '0').slice(0, 2) || '0')
  if (!Number.isSafeInteger(paisa)) return { ok: false, error: 'Amount is too large' }
  if (paisa <= 0) return { ok: false, error: 'Amount must be greater than zero' }
  return { ok: true, paisa }
}

export function formatMoney(paisa: number, symbol = 'Rs.'): string {
  const sign = paisa < 0 ? '-' : ''
  const abs = Math.abs(paisa)
  const rupees = Math.trunc(abs / PAISA_PER_RUPEE)
  const remainder = abs % PAISA_PER_RUPEE
  const grouped = new Intl.NumberFormat('en-IN').format(rupees)
  if (remainder === 0) return `${sign}${symbol} ${grouped}`
  return `${sign}${symbol} ${grouped}.${String(remainder).padStart(2, '0')}`
}

export function remainingOf(expected: number, received: number): number {
  return Math.max(0, expected - received)
}
