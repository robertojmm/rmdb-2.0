export type MovieSearchResult = {
  externalId: string
  title: string
  originalTitle: string | null
  year: number | null
  overview: string | null
  posterUrl: string | null
  rating: number | null
  tmdbId?: number
  sourceId: number
}

export interface ApiAdapter {
  search(query: string, apiKey: string | null, sourceId: number): Promise<MovieSearchResult[]>
}
