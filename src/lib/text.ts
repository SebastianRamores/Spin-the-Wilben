/** Rough per-character width in em, used to fit names inside wheel wedges. */
export function charWidth(ch: string): number {
  if (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch)) {
    return 1.85
  }
  if (/[MWmw@%&]/.test(ch)) return 1.04
  if (/[iljI.,'`:;!|[\]()]/.test(ch)) return 0.34
  if (/[ ]/.test(ch)) return 0.32
  if (/[0-9]/.test(ch)) return 0.56
  return 0.6
}

export function textWidth(text: string, fontSize: number): number {
  let units = 0
  for (const ch of text) units += charWidth(ch)
  return units * fontSize
}

/** Truncates with an ellipsis so a label cannot spill out of its wedge. */
export function fitLabel(text: string, maxWidth: number, fontSize: number): string {
  if (textWidth(text, fontSize) <= maxWidth) return text
  const ellipsis = '…'
  const budget = maxWidth - textWidth(ellipsis, fontSize)
  let out = ''
  let used = 0
  for (const ch of text) {
    const w = charWidth(ch) * fontSize
    if (used + w > budget) break
    out += ch
    used += w
  }
  return `${out.trimEnd()}${ellipsis}`
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
