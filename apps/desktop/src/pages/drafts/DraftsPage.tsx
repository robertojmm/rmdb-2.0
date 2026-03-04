import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Inbox, Search, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { api, API_URL } from '../../lib/api'
import { getLastApiSource, saveLastApiSource } from '../../lib/preferences'
import { ApiSourceSelect, type ApiSource } from '../add-movie/ApiSourceSelect'
import { MovieDraftModal } from '../add-movie/MovieDraftModal'
import type { SearchResult } from '../add-movie/ApiPanel'

type Draft = {
  id: number
  filePath: string
  parsedTitle: string | null
  parsedYear: number | null
  savedAt: string
}

export function DraftsPage() {
  const { t } = useTranslation()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selected, setSelected] = useState<Draft | null>(null)
  const [modalDraft, setModalDraft] = useState<SearchResult | null>(null)
  const [modalFilePath, setModalFilePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    void loadDrafts()
  }, [])

  async function loadDrafts() {
    const result = await api['movie-drafts'].get()
    if (result.data) setDrafts(result.data as Draft[])
  }

  async function discard(draft: Draft) {
    await api['movie-drafts'][draft.id].delete()
    setDrafts(prev => prev.filter(d => d.id !== draft.id))
    if (selected?.id === draft.id) setSelected(null)
  }

  function onSaved(externalId: string) {
    // externalId is the filePath used as draft key
    const draft = drafts.find(d => d.filePath === externalId || d.id === selected?.id)
    if (draft) {
      void api['movie-drafts'][draft.id].delete()
      setDrafts(prev => prev.filter(d => d.id !== draft.id))
      if (selected?.id === draft.id) setSelected(null)
    }
    setModalDraft(null)
  }

  function openManualEdit(draft: Draft) {
    setModalFilePath(draft.filePath)
    setModalDraft({
      externalId: draft.filePath,
      title: draft.parsedTitle ?? '',
      originalTitle: null,
      year: draft.parsedYear ?? null,
      overview: null,
      posterUrl: null,
      rating: null,
      sourceId: 0,
    })
  }

  function openWithResult(result: SearchResult, draft: Draft) {
    setModalFilePath(draft.filePath)
    setModalDraft(result)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t('drafts.title')}</h1>
        {drafts.length > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {drafts.length} {drafts.length === 1 ? 'pending' : 'pending'}
          </p>
        )}
      </div>

      {drafts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <Inbox size={40} className="text-neutral-300 dark:text-neutral-600" />
          <p className="font-medium text-neutral-600 dark:text-neutral-400">{t('drafts.empty')}</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-xs">{t('drafts.emptyDesc')}</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Draft list */}
          <div className="w-72 shrink-0 flex flex-col gap-1 overflow-y-auto">
            {drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => setSelected(draft)}
                className={[
                  'w-full text-left px-3 py-2.5 rounded-lg border transition-colors',
                  selected?.id === draft.id
                    ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600',
                ].join(' ')}
              >
                <p className={`text-sm font-medium truncate ${selected?.id === draft.id ? 'text-white dark:text-neutral-900' : 'text-neutral-800 dark:text-neutral-200'}`}>
                  {draft.parsedTitle ?? draft.filePath}
                  {draft.parsedYear && (
                    <span className={`font-normal ml-1 ${selected?.id === draft.id ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-400'}`}>
                      ({draft.parsedYear})
                    </span>
                  )}
                </p>
                <p className={`text-xs truncate mt-0.5 ${selected?.id === draft.id ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-400'}`}>
                  {draft.filePath}
                </p>
              </button>
            ))}
          </div>

          {/* Action panel */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <DraftActionPanel
                draft={selected}
                onOpenResult={result => openWithResult(result, selected)}
                onEditManually={() => openManualEdit(selected)}
                onDiscard={() => void discard(selected)}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400 flex items-center gap-2">
                  <ChevronRight size={14} />
                  {t('drafts.selectTip')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {modalDraft && (
        <MovieDraftModal
          draft={modalDraft}
          initialFilePath={modalFilePath}
          onClose={() => setModalDraft(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

// ─── DraftActionPanel ──────────────────────────────────────────────────────────

function DraftActionPanel({ draft, onOpenResult, onEditManually, onDiscard }: {
  draft: { parsedTitle: string | null; parsedYear: number | null }
  onOpenResult: (result: SearchResult) => void
  onEditManually: () => void
  onDiscard: () => void
}) {
  const { t } = useTranslation()
  const [source, setSource] = useState<ApiSource | null>(getLastApiSource)
  const [query, setQuery] = useState(draft.parsedTitle ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Reset search when draft changes
  useEffect(() => {
    setQuery(draft.parsedTitle ?? '')
    setResults([])
    setSearched(false)
  }, [draft.parsedTitle])

  async function handleSearch() {
    if (!source || !query.trim()) return
    setLoading(true)
    setSearched(false)
    const result = await api['api-sources'][source.id].search.get({ query: { q: query.trim() } })
    setLoading(false)
    setSearched(true)
    if (result.data && Array.isArray(result.data)) {
      setResults(result.data as SearchResult[])
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
      {/* API search */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {t('drafts.search')}
        </p>
        <ApiSourceSelect
          value={source}
          onChange={s => { setSource(s); saveLastApiSource(s); setResults([]); setSearched(false) }}
        />
        <div className="flex gap-2">
          <input
            className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSearch() }}
            placeholder={draft.parsedTitle ?? ''}
          />
          <button
            onClick={() => void handleSearch()}
            disabled={!source || !query.trim() || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search size={13} />
          </button>
        </div>

        {/* Search results */}
        {searched && results.length === 0 && (
          <p className="text-xs text-neutral-400">{t('addMovie.api.noResults')}</p>
        )}
        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {results.map(r => (
              <li key={r.externalId}>
                <button
                  onClick={() => onOpenResult(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors text-left"
                >
                  <div className="shrink-0 w-8 h-11 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                    <img
                      src={r.posterUrl ?? `${API_URL}/assets/default_poster`}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {r.title}
                      {r.year && <span className="text-neutral-400 font-normal ml-1.5">({r.year})</span>}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-neutral-100 dark:border-neutral-800" />
        <span className="text-xs text-neutral-400">or</span>
        <div className="flex-1 border-t border-neutral-100 dark:border-neutral-800" />
      </div>

      {/* Manual edit */}
      <button
        onClick={onEditManually}
        className="self-start flex items-center gap-1.5 px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <Pencil size={14} />
        {t('drafts.editManually')}
      </button>

      {/* Discard */}
      <button
        onClick={onDiscard}
        className="mt-auto self-start flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <Trash2 size={13} />
        {t('drafts.discard')}
      </button>
    </div>
  )
}
