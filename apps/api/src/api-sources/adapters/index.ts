import type { ApiAdapter } from './types'
import { createTmdbAdapter } from './tmdb'
import { createOmdbAdapter } from './omdb'
import { createFreeMovieApiAdapter } from './free-movie-api'

export function getAdapter(url: string): ApiAdapter | null {
  if (url.includes('themoviedb.org')) return createTmdbAdapter(url)
  if (url.includes('omdbapi.com')) return createOmdbAdapter(url)
  if (url.includes('iamidiotareyoutoo.com')) return createFreeMovieApiAdapter(url)
  return null
}

export type { MovieSearchResult } from './types'
