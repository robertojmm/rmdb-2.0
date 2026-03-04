import { treaty } from '@elysiajs/eden'
import type { App } from '@some-project/api'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = treaty<App>(API_URL)

/** Resolves a posterPath from the DB to a full image URL.
 *  - Local paths (/assets/posters/1) → prefixed with API_URL
 *  - External URLs (https://...) → used as-is
 *  - null/undefined → default poster
 */
export function resolvePosterUrl(path: string | null | undefined): string {
  if (!path) return `${API_URL}/assets/default_poster`
  if (path.startsWith('/')) return `${API_URL}${path}`
  return path
}
