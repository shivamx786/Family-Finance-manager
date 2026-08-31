export function newId(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function stamp() {
  const t = nowISO()
  return { createdAt: t, updatedAt: t }
}

export function touch<T extends { updatedAt: string }>(row: T): T {
  return { ...row, updatedAt: nowISO() }
}
