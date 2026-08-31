import { db } from '@/db/database'
import { toISODate } from '@/lib/dates'
import type { BackupFile } from '@/types'

export async function exportBackup(): Promise<BackupFile> {
  const [
    people,
    properties,
    categories,
    templates,
    incomes,
    receipts,
    expenses,
    bills,
    loans,
    repayments,
    settings,
    auditLogs,
  ] = await Promise.all([
    db.people.toArray(),
    db.properties.toArray(),
    db.categories.toArray(),
    db.templates.toArray(),
    db.incomes.toArray(),
    db.receipts.toArray(),
    db.expenses.toArray(),
    db.bills.toArray(),
    db.loans.toArray(),
    db.repayments.toArray(),
    db.settings.toArray(),
    db.auditLogs.toArray(),
  ])
  return {
    app: 'family-finance',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      people,
      properties,
      categories,
      templates,
      incomes,
      receipts,
      expenses,
      bills,
      loans,
      repayments,
      settings,
      auditLogs,
    },
  }
}

export function backupFilename(): string {
  return `family-finance-backup-${toISODate(new Date())}.json`
}

export function validateBackup(raw: unknown): { ok: true; data: BackupFile } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'This file is not a valid backup.' }
  const b = raw as BackupFile
  if (b.app !== 'family-finance') return { ok: false, error: 'This file is not a Family Finance backup.' }
  if (b.version !== 1) return { ok: false, error: 'This backup version is not supported.' }
  if (!b.data || !Array.isArray(b.data.incomes) || !Array.isArray(b.data.expenses)) {
    return { ok: false, error: 'Backup is missing required data.' }
  }
  return { ok: true, data: b }
}

export async function restoreBackup(backup: BackupFile) {
  await db.transaction(
    'rw',
    [
      db.people,
      db.properties,
      db.categories,
      db.templates,
      db.incomes,
      db.receipts,
      db.expenses,
      db.bills,
      db.loans,
      db.repayments,
      db.settings,
      db.auditLogs,
    ],
    async () => {
      await Promise.all([
        db.people.clear(),
        db.properties.clear(),
        db.categories.clear(),
        db.templates.clear(),
        db.incomes.clear(),
        db.receipts.clear(),
        db.expenses.clear(),
        db.bills.clear(),
        db.loans.clear(),
        db.repayments.clear(),
        db.settings.clear(),
        db.auditLogs.clear(),
      ])
      const d = backup.data
      if (d.people.length) await db.people.bulkAdd(d.people)
      if (d.properties.length) await db.properties.bulkAdd(d.properties)
      if (d.categories.length) await db.categories.bulkAdd(d.categories)
      if (d.templates.length) await db.templates.bulkAdd(d.templates)
      if (d.incomes.length) await db.incomes.bulkAdd(d.incomes)
      if (d.receipts.length) await db.receipts.bulkAdd(d.receipts)
      if (d.expenses.length) await db.expenses.bulkAdd(d.expenses)
      if (d.bills.length) await db.bills.bulkAdd(d.bills)
      if (d.loans.length) await db.loans.bulkAdd(d.loans)
      if (d.repayments.length) await db.repayments.bulkAdd(d.repayments)
      if (d.settings.length) await db.settings.bulkAdd(d.settings)
      else {
        await db.settings.put({
          id: 'app',
          setupComplete: true,
          currencySymbol: 'Rs.',
          theme: 'system',
          demoLoaded: false,
        })
      }
      if (d.auditLogs?.length) await db.auditLogs.bulkAdd(d.auditLogs)
    },
  )
}

function csvEscape(v: string | number | undefined): string {
  const s = v === undefined ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: (string | number | undefined)[][]): string {
  return [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n')
}
