import type { ApiSource } from '../pages/add-movie/ApiSourceSelect'

const LAST_API_SOURCE_KEY = 'pref:lastApiSource'

export function getLastApiSource(): ApiSource | null {
  try {
    const raw = localStorage.getItem(LAST_API_SOURCE_KEY)
    return raw ? (JSON.parse(raw) as ApiSource) : null
  } catch {
    return null
  }
}

export function saveLastApiSource(source: ApiSource): void {
  localStorage.setItem(LAST_API_SOURCE_KEY, JSON.stringify(source))
}
