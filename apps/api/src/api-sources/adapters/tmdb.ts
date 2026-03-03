import type { ApiAdapter, MovieSearchResult } from './types'

type TmdbMovie = {
  id: number
  title: string
  original_title: string
  release_date: string
  overview: string
  poster_path: string | null
  vote_average: number
}

type TmdbSearchResponse = {
  results: TmdbMovie[]
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'

export function createTmdbAdapter(baseUrl: string): ApiAdapter {
  return {
    async search(query, apiKey, sourceId) {
      if (!apiKey) throw new Error('TMDB requires an API key')

      const url = new URL(`${baseUrl}/search/movie`)
      url.searchParams.set('query', query)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('language', 'en-US')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`TMDB responded with status ${res.status}`)

      const data = await res.json() as TmdbSearchResponse

      return data.results.map((m): MovieSearchResult => ({
        externalId: String(m.id),
        title: m.title,
        originalTitle: m.original_title && m.original_title !== m.title ? m.original_title : null,
        year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
        overview: m.overview || null,
        posterUrl: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : null,
        rating: m.vote_average > 0 ? Math.round(m.vote_average * 10) / 10 : null,
        tmdbId: m.id,
        sourceId,
      }))
    },
  }
}
