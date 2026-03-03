import type { ApiAdapter, MovieSearchResult } from './types'

type OmdbMovie = {
  Title: string
  Year: string
  imdbID: string
  Type: string
  Poster: string
}

type OmdbSearchResponse =
  | { Response: 'True'; Search: OmdbMovie[]; totalResults: string }
  | { Response: 'False'; Error: string }

export function createOmdbAdapter(baseUrl: string): ApiAdapter {
  return {
    async search(query, apiKey, sourceId) {
      if (!apiKey) throw new Error('OMDb requires an API key')

      const url = new URL(baseUrl)
      url.searchParams.set('s', query)
      url.searchParams.set('apikey', apiKey)
      url.searchParams.set('type', 'movie')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`OMDb responded with status ${res.status}`)

      const data = await res.json() as OmdbSearchResponse
      if (data.Response === 'False') throw new Error(data.Error)

      return data.Search.map((m): MovieSearchResult => ({
        externalId: m.imdbID,
        title: m.Title,
        originalTitle: null,
        year: m.Year ? Number(m.Year.slice(0, 4)) : null,
        overview: null,
        posterUrl: m.Poster !== 'N/A' ? m.Poster : null,
        rating: null,
        sourceId,
      }))
    },
  }
}
