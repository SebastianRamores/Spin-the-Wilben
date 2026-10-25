export type Participants = Participant[]

export interface Participant {
  id: string
  name: string
}

export interface BulkResult {
  names: string[]
  added: number
  duplicates: number
  empties: number
  overflow: number
}

export function createId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

/** Lowercased, whitespace-collapsed comparison key used for duplicate checks. */
export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function parseNameList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => cleanName(line))
    .filter((line) => line.length > 0)
}

export function validateNewName(
  name: string,
  existing: Participants,
): { ok: true; name: string } | { ok: false; error: string } {
  const cleaned = cleanName(name)
  if (!cleaned) return { ok: false, error: 'Enter a name first.' }
  if (cleaned.length > 28) return { ok: false, error: 'Keep names under 29 characters.' }
  const key = nameKey(cleaned)
  if (existing.some((p) => nameKey(p.name) === key)) {
    return { ok: false, error: `“${cleaned}” is already on the wheel.` }
  }
  return { ok: true, name: cleaned }
}

/** Merge a pasted list into the roster, dropping blanks and duplicates. */
export function mergeNames(
  raw: string[],
  existing: Participants,
  limit: number,
  mode: 'append' | 'replace' = 'append',
): BulkResult {
  const seen = new Set(mode === 'replace' ? [] : existing.map((p) => nameKey(p.name)))
  const names: string[] = []
  let duplicates = 0
  let empties = 0
  let overflow = 0

  for (const item of raw) {
    const cleaned = cleanName(item)
    if (!cleaned) {
      empties += 1
      continue
    }
    if (cleaned.length > 28) {
      overflow += 1
      continue
    }
    const key = nameKey(cleaned)
    if (seen.has(key)) {
      duplicates += 1
      continue
    }
    seen.add(key)
    names.push(cleaned)
  }

  const base = mode === 'replace' ? [] : existing
  const room = Math.max(0, limit - base.length)
  if (names.length > room) {
    overflow += names.length - room
    names.length = room
  }

  return { names, added: names.length, duplicates, empties, overflow }
}

export function toParticipants(names: string[]): Participants {
  return names.map((name) => ({ id: createId(), name }))
}

export function isParticipantList(value: unknown): value is Participant {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && v.name.trim().length > 0
}
