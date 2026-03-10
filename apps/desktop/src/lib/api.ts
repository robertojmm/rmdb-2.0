import { treaty } from '@elysiajs/eden'
import type { App } from '@some-project/api'

export let API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export let api = treaty<App>(API_URL)

export function initApiUrl(url: string) {
  API_URL = url
  api = treaty<App>(url)
}

export function getApiUrl(): string {
  return API_URL
}

export type PosterSize = 'small' | 'medium' | 'big'

/** Resolves a posterPath from the DB to a full image URL.
 *  - Local base paths (/assets/posters/20) → suffixed with size and extension
 *  - External URLs (https://...) → used as-is
 *  - null/undefined → default poster
 */
export function resolvePosterUrl(path: string | null | undefined, size: PosterSize = 'medium'): string {
  if (!path) return `${API_URL}/assets/default_poster`
  if (path.startsWith('/')) {
    if (/\.(jpg|jpeg|png|webp)$/i.test(path)) return `${API_URL}${path}` // legacy single-file format
    return `${API_URL}${path}_${size}.jpg`
  }
  return path
}
