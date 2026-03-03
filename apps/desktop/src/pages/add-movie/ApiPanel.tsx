import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Check, Plus, AlertCircle } from 'lucide-react'
import { api, API_URL } from '../../lib/api'
import { getLastApiSource, saveLastApiSource } from '../../lib/preferences'
import { ApiSourceSelect, type ApiSource } from './ApiSourceSelect'
import { MovieDraftModal } from './MovieDraftModal'

export type SearchResult = NonNullable<
  Awaited<ReturnType<typeof api['api-sources'][string]['search']['get']>>['data']
>[number]

export function ApiPanel() {
  const { t } = useTranslation()
  const [source, setSource] = useState<ApiSource | null>(getLastApiSource)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState<SearchResult | null>(null)

  function handleSourceChange(s: ApiSource) {
    setSource(s)
    saveLastApiSource(s)
    setResults([])
    setSearched(false)
    setError(null)
  }

  async function handleSearch() {
    if (!source || !query.trim()) return
    setLoading(true)
    setError(null)
    setSearched(false)
    const result = await api['api-sources'][source.id].search.get({ query: { q: query.trim() } })
    setLoading(false)
    setSearched(true)
    if (result.error || !Array.isArray(result.data)) {
      setError(t('addMovie.api.searchError'))
      setResults([])
    } else {
      setResults(result.data)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
            {t('addMovie.apiSourceLabel')}
          </p>
          <ApiSourceSelect value={source} onChange={handleSourceChange} />
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
            {t('addMovie.api.movieLabel')}
          </p>
          <div className="flex gap-2">
            <input
              disabled={!source}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && source && query.trim()) void handleSearch() }}
              placeholder="e.g. The Dark Knight"
              className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 disabled:opacity-50 transition-opacity"
            />
            <button
              disabled={!source || !query.trim() || loading}
              onClick={() => void handleSearch()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Search size={14} />
              {t('addMovie.api.searchBtn')}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {searched && !error && (
          results.length === 0 ? (
            <p className="text-sm text-neutral-400">{t('addMovie.api.noResults')}</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {results.map(movie => (
                <div
                  key={movie.externalId}
                  className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                >
                  <img
                    src={movie.posterUrl ?? `${API_URL}/assets/default_poster`}
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded-lg shrink-0 bg-neutral-200 dark:bg-neutral-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{movie.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {[movie.year, movie.rating ? `★ ${movie.rating}` : null].filter(Boolean).join(' · ')}
                    </p>
                    {movie.overview && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{movie.overview}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center">
                    {addedIds.has(movie.externalId) ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <button
                        onClick={() => setDraft(movie)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
                      >
                        <Plus size={12} />
                        {t('addMovie.api.addBtn')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {draft && (
        <MovieDraftModal
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={externalId => {
            setAddedIds(prev => new Set([...prev, externalId]))
            setDraft(null)
          }}
        />
      )}
    </>
  )
}
