import type { ApiAdapter, MovieSearchResult } from './types'

type FreeMovieApiMovie = {
  '#TITLE': string
  '#YEAR': number
  '#IMDB_ID': string
  '#IMG_POSTER': string | null
}

type FreeMovieApiResponse = {
  ok: boolean
  description: FreeMovieApiMovie[]
}

export function createFreeMovieApiAdapter(baseUrl: string): ApiAdapter {
  return {
    async search(query, _apiKey, sourceId) {
      const url = new URL(`${baseUrl}/search`)
      url.searchParams.set('q', query)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Free Movie API responded with status ${res.status}`)

      const data = await res.json() as FreeMovieApiResponse
      if (!data.ok) throw new Error('Free Movie API returned an error')

      return data.description.map((m): MovieSearchResult => ({
        externalId: m['#IMDB_ID'],
        title: m['#TITLE'],
        originalTitle: null,
        year: m['#YEAR'] ?? null,
        overview: null,
        posterUrl: m['#IMG_POSTER'] ?? null,
        rating: null,
        sourceId,
      }))
    },
  }
}
