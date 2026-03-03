// Matches a year (1900–2099) surrounded by separators (dots, spaces, brackets)
// Requires a separator before AND after, so "2001" at the start of a filename
// won't match, but ".2001." will. This correctly handles titles like "2001: A Space Odyssey".
const YEAR_RE = /[.\s_([]((?:19|20)\d{2})[.\s_)\]]/

export function parseFilename(filename: string): { title: string; year: number | null } {
  // Remove file extension
  const base = filename.replace(/\.[^.]+$/, '')

  const match = YEAR_RE.exec(base)
  let rawTitle: string
  let year: number | null = null

  if (match) {
    rawTitle = base.slice(0, match.index)
    year = Number(match[1])
  } else {
    rawTitle = base
  }

  const title = rawTitle
    .replace(/[._]/g, ' ')   // dots/underscores → spaces
    .replace(/\s+/g, ' ')    // collapse whitespace
    .replace(/[\s\-_]+$/, '') // trailing separators
    .trim()

  // Fallback to base name if cleaning produced an empty string
  return { title: title || base, year }
}
