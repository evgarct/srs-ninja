export function normalizeNoteTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const value = tag.trim()
    const dedupeKey = value.toLowerCase()
    if (!value || seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    normalized.push(value)
  }

  return normalized
}

export function parseTagsInput(value: string): string[] {
  return normalizeNoteTags(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  )
}
