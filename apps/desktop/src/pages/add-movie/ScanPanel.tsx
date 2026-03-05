import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Folder, Play, CheckCircle2, SkipForward, Plus, Pencil, Trash2, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLastApiSource, saveLastApiSource } from '../../lib/preferences'
import { ApiSourceSelect, type ApiSource } from './ApiSourceSelect'
import { MovieDraftModal } from './MovieDraftModal'
import { api, API_URL } from '../../lib/api'
import { logger } from '../../lib/logger'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanFolder = { id: number; path: string }

type MovieMatch = {
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

type IdentifiedResult = { filePath: string; match: MovieMatch }
type UnidentifiedResult = { filePath: string; parsedTitle: string; parsedYear: number | null }

type ScanEvent =
  | { type: 'start'; total: number }
  | { type: 'progress'; current: number; total: number; file: string }
  | { type: 'result'; filePath: string; match: MovieMatch }
  | { type: 'unidentified'; filePath: string; parsedTitle: string; parsedYear: number | null }
  | { type: 'done'; found: number; unidentified: number }
  | { type: 'error'; message: string }

type Status = 'idle' | 'scanning' | 'choosing' | 'reviewing' | 'adding' | 'unidentified' | 'complete'

// ─── Component ────────────────────────────────────────────────────────────────

export function ScanPanel() {
  const { t } = useTranslation()
  const [source, setSource] = useState<ApiSource | null>(getLastApiSource)
  const [folders, setFolders] = useState<ScanFolder[]>([])
  const [status, setStatus] = useState<Status>('idle')

  // Scan progress
  const [scanTotal, setScanTotal] = useState(0)
  const [scanCurrent, setScanCurrent] = useState(0)
  const [scanFile, setScanFile] = useState('')
  const [step1Done, setStep1Done] = useState(false)

  // Results accumulated from SSE
  const [identified, setIdentified] = useState<IdentifiedResult[]>([])
  const [unidentified, setUnidentified] = useState<UnidentifiedResult[]>([])

  // Review / add tracking
  const [reviewIndex, setReviewIndex] = useState(0)
  const [addingIndex, setAddingIndex] = useState(0)
  const [addedCount, setAddedCount] = useState(0)

  // Unidentified item being edited in MovieDraftModal
  const [editingItem, setEditingItem] = useState<UnidentifiedResult | null>(null)

  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    void (async () => {
      const result = await api['scan-folders'].get()
      if (result.data) setFolders(result.data as ScanFolder[])
    })()
  }, [])

  // ── Scan ───────────────────────────────────────────────────────────────────

  function startScan() {
    if (!source || folders.length === 0) return

    setStatus('scanning')
    setScanTotal(0)
    setScanCurrent(0)
    setScanFile('')
    setStep1Done(false)
    setIdentified([])
    setUnidentified([])
    setAddedCount(0)
    setReviewIndex(0)
    setAddingIndex(0)

    const es = new EventSource(`${API_URL}/scan/stream?sourceId=${source.id}`)
    esRef.current = es

    es.onmessage = (e: MessageEvent<string>) => {
      let event: ScanEvent
      try {
        event = JSON.parse(e.data) as ScanEvent
      } catch (err) {
        logger.error('Failed to parse SSE event', { data: e.data, error: String(err) })
        return
      }

      switch (event.type) {
        case 'start':
          setScanTotal(event.total)
          setStep1Done(true)
          break
        case 'progress':
          setScanCurrent(event.current)
          setScanFile(event.file)
          break
        case 'result':
          setIdentified(prev => [...prev, { filePath: event.filePath, match: event.match }])
          break
        case 'unidentified':
          setUnidentified(prev => [...prev, { filePath: event.filePath, parsedTitle: event.parsedTitle, parsedYear: event.parsedYear }])
          break
        case 'done':
          es.close()
          setStatus('choosing')
          break
        case 'error':
          logger.error('Scan error from server', { message: event.message })
          es.close()
          setStatus('idle')
          break
      }
    }

    es.onerror = () => {
      es.close()
      // Don't reset if scan already completed — server closing the SSE connection
      // after sending 'done' fires onerror, which would clobber the 'choosing' state
      setStatus(prev => {
        if (prev === 'scanning') logger.error('SSE stream connection lost during scan')
        return prev === 'scanning' ? 'idle' : prev
      })
    }
  }

  // ── Auto-add ───────────────────────────────────────────────────────────────

  async function autoAdd() {
    setStatus('adding')
    let added = 0

    for (let i = 0; i < identified.length; i++) {
      setAddingIndex(i + 1)
      const { filePath, match } = identified[i]!
      await api.movies.post({
        title: match.title,
        originalTitle: match.originalTitle ?? undefined,
        year: match.year ?? undefined,
        overview: match.overview ?? undefined,
        rating: match.rating ?? undefined,
        posterPath: match.posterUrl ?? undefined,
        filePath,
        tmdbId: match.tmdbId,
      })
      added++
    }

    setAddedCount(added)
    if (unidentified.length > 0) {
      setStatus('unidentified')
    } else {
      setStatus('complete')
    }
  }

  // ── Manual review ──────────────────────────────────────────────────────────

  function startReview() {
    setStatus('reviewing')
    setReviewIndex(0)
  }

  async function addCurrentAndNext() {
    const item = identified[reviewIndex]
    if (!item) return
    await api.movies.post({
      title: item.match.title,
      originalTitle: item.match.originalTitle ?? undefined,
      year: item.match.year ?? undefined,
      overview: item.match.overview ?? undefined,
      rating: item.match.rating ?? undefined,
      posterPath: item.match.posterUrl ?? undefined,
      filePath: item.filePath,
      tmdbId: item.match.tmdbId,
    })
    setAddedCount(c => c + 1)
    advanceReview()
  }

  function advanceReview() {
    const next = reviewIndex + 1
    if (next >= identified.length) {
      if (unidentified.length > 0) {
        setStatus('unidentified')
      } else {
        setStatus('complete')
      }
    } else {
      setReviewIndex(next)
    }
  }

  // ── Unidentified ───────────────────────────────────────────────────────────

  function removeUnidentified(filePath: string) {
    setUnidentified(prev => {
      const next = prev.filter(u => u.filePath !== filePath)
      if (next.length === 0) setStatus('complete')
      return next
    })
  }

  function onUnidentifiedSaved(externalId: string) {
    // externalId is the filePath for unidentified items
    setAddedCount(c => c + 1)
    setEditingItem(null)
    removeUnidentified(externalId)
  }

  async function saveOneForLater(item: UnidentifiedResult) {
    await api['movie-drafts'].post({
      filePath: item.filePath,
      parsedTitle: item.parsedTitle,
      parsedYear: item.parsedYear ?? null,
    })
    removeUnidentified(item.filePath)
  }

  async function saveAllForLater() {
    const items = [...unidentified]
    for (const item of items) {
      await api['movie-drafts'].post({
        filePath: item.filePath,
        parsedTitle: item.parsedTitle,
        parsedYear: item.parsedYear ?? null,
      })
    }
    setUnidentified([])
  }

  function reset() {
    esRef.current?.close()
    setStatus('idle')
    setIdentified([])
    setUnidentified([])
    setScanTotal(0)
    setScanCurrent(0)
    setReviewIndex(0)
    setAddedCount(0)
    setAddingIndex(0)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const pct = scanTotal > 0 ? Math.round((scanCurrent / scanTotal) * 100) : 0
  const currentReviewItem = identified[reviewIndex]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-6">

      {/* ── IDLE ── */}
      {status === 'idle' && (
        <>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              {t('addMovie.apiSourceLabel')}
            </p>
            <ApiSourceSelect value={source} onChange={s => { setSource(s); saveLastApiSource(s) }} />
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800" />

          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              {t('addMovie.search.foldersLabel')}
            </p>
            {folders.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500">
                {t('addMovie.search.noFolders')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {folders.map(folder => (
                  <li key={folder.id} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <Folder size={14} className="shrink-0 text-neutral-400" />
                    {folder.path}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            disabled={!source || folders.length === 0}
            onClick={startScan}
            className="self-start flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={14} />
            {t('addMovie.search.startScan')}
          </button>
        </>
      )}

      {/* ── SCANNING ── */}
      {status === 'scanning' && (
        <div className="flex flex-col gap-4">
          <StepRow
            label={t('addMovie.search.step1')}
            done={step1Done}
            active={!step1Done}
            index={1}
            rightText={step1Done ? t('addMovie.search.done') : ''}
            progress={step1Done ? 100 : 0}
          />
          <StepRow
            label={t('addMovie.search.step2')}
            done={false}
            active={step1Done}
            index={2}
            rightText={step1Done ? `${scanCurrent} / ${scanTotal} (${pct}%)` : ''}
            progress={pct}
          />
          {scanFile && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{scanFile}</p>
          )}
        </div>
      )}

      {/* ── CHOOSING ── */}
      {status === 'choosing' && (
        <ChoosingView
          identified={identified}
          unidentified={unidentified}
          onAutoAdd={() => void autoAdd()}
          onStartReview={startReview}
          onGoToUnidentified={() => setStatus('unidentified')}
          onSaveAllForLater={() => void saveAllForLater()}
        />
      )}

      {/* ── REVIEWING ── */}
      {status === 'reviewing' && currentReviewItem && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {t('addMovie.search.reviewing', { current: reviewIndex + 1, total: identified.length })}
          </p>

          <div className="flex gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <div className="shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700">
              <img
                src={currentReviewItem.match.posterUrl ?? `${API_URL}/assets/default_poster`}
                alt={currentReviewItem.match.title}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                {currentReviewItem.match.title}
              </p>
              {currentReviewItem.match.year && (
                <p className="text-xs text-neutral-500">{currentReviewItem.match.year}</p>
              )}
              {currentReviewItem.match.overview && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mt-1">
                  {currentReviewItem.match.overview}
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-auto truncate">{currentReviewItem.filePath}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => void addCurrentAndNext()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              <Plus size={14} />
              {t('addMovie.manual.addToLibrary')}
            </button>
            <button
              onClick={advanceReview}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <SkipForward size={14} />
              {t('addMovie.search.skip')}
            </button>
          </div>
        </div>
      )}

      {/* ── AUTO-ADDING ── */}
      {status === 'adding' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('addMovie.search.autoAdding', { current: addingIndex, total: identified.length })}
          </p>
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
              style={{ width: identified.length > 0 ? `${Math.round((addingIndex / identified.length) * 100)}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* ── UNIDENTIFIED ── */}
      {status === 'unidentified' && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              {t('addMovie.search.unidentifiedTitle')}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {t('addMovie.search.unidentifiedDesc')}
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {unidentified.map(item => (
              <li key={item.filePath} className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {item.parsedTitle}
                    {item.parsedYear && (
                      <span className="text-neutral-400 font-normal ml-1">({item.parsedYear})</span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{item.filePath}</p>
                </div>
                <button
                  onClick={() => setEditingItem(item)}
                  className="shrink-0 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <Pencil size={12} />
                  {t('addMovie.search.editManually')}
                </button>
                <button
                  onClick={() => void saveOneForLater(item)}
                  title={t('addMovie.search.saveOneForLater')}
                  className="shrink-0 text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <Bookmark size={14} />
                </button>
                <button
                  onClick={() => removeUnidentified(item.filePath)}
                  className="shrink-0 text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── COMPLETE ── */}
      {status === 'complete' && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-neutral-900 dark:text-white">
              {t('addMovie.search.complete')}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {t('addMovie.search.addedCount', { count: addedCount })}
            </p>
          </div>
          <button
            onClick={reset}
            className="self-start flex items-center gap-1.5 px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Play size={14} />
            {t('addMovie.search.newScan')}
          </button>
        </div>
      )}

      {/* MovieDraftModal for editing unidentified files */}
      {editingItem && (
        <MovieDraftModal
          draft={{
            externalId: editingItem.filePath,
            title: editingItem.parsedTitle,
            originalTitle: null,
            year: editingItem.parsedYear,
            overview: null,
            posterUrl: null,
            rating: null,
            sourceId: 0,
          }}
          initialFilePath={editingItem.filePath}
          onClose={() => setEditingItem(null)}
          onSaved={onUnidentifiedSaved}
        />
      )}
    </div>
  )
}

// ─── ChoosingView ─────────────────────────────────────────────────────────────

function ChoosingView({ identified, unidentified, onAutoAdd, onStartReview, onGoToUnidentified, onSaveAllForLater }: {
  identified: IdentifiedResult[]
  unidentified: UnidentifiedResult[]
  onAutoAdd: () => void
  onStartReview: () => void
  onGoToUnidentified: () => void
  onSaveAllForLater: () => void
}) {
  const { t } = useTranslation()
  const [identifiedPage, setIdentifiedPage] = useState(0)
  const [unidentifiedPage, setUnidentifiedPage] = useState(0)

  const ITEMS_PER_PAGE = 5
  const identifiedPageCount = Math.ceil(identified.length / ITEMS_PER_PAGE)
  const identifiedPageItems = identified.slice(identifiedPage * ITEMS_PER_PAGE, (identifiedPage + 1) * ITEMS_PER_PAGE)
  const unidentifiedPageCount = Math.ceil(unidentified.length / ITEMS_PER_PAGE)
  const unidentifiedPageItems = unidentified.slice(unidentifiedPage * ITEMS_PER_PAGE, (unidentifiedPage + 1) * ITEMS_PER_PAGE)

  // Preload poster images so page navigation is instant
  useEffect(() => {
    identified.forEach(item => {
      if (item.match.posterUrl) {
        const img = new window.Image()
        img.src = item.match.posterUrl
      }
    })
  }, [identified])

  return (
    <div className="flex-1 flex flex-col gap-5 min-h-0">
      <p className="shrink-0 text-base font-semibold text-neutral-900 dark:text-white">
        {t('addMovie.search.scanComplete')}
      </p>

      {/* Identified list */}
      {identified.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {t('addMovie.search.identified', { count: identified.length })}
          </p>
          <ul className="flex flex-col gap-1.5">
            {identifiedPageItems.map((item, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="shrink-0 w-8 h-11 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                  <img
                    src={item.match.posterUrl ?? `${API_URL}/assets/default_poster`}
                    alt={item.match.title}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {item.match.title}
                    {item.match.year && (
                      <span className="text-neutral-400 font-normal ml-1.5">({item.match.year})</span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">{item.filePath}</p>
                </div>
              </li>
            ))}
          </ul>
          <PaginationBar page={identifiedPage} total={identifiedPageCount} onChange={setIdentifiedPage} />
        </div>
      )}

      {/* Unidentified list */}
      {unidentified.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {t('addMovie.search.notIdentified', { count: unidentified.length })}
          </p>
          <ul className="flex flex-col gap-1.5">
            {unidentifiedPageItems.map((item, i) => (
              <li key={i} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {item.parsedTitle}
                  {item.parsedYear && (
                    <span className="text-neutral-400 font-normal ml-1">({item.parsedYear})</span>
                  )}
                </p>
                <p className="text-xs text-neutral-400 truncate">{item.filePath}</p>
              </li>
            ))}
          </ul>
          <PaginationBar page={unidentifiedPage} total={unidentifiedPageCount} onChange={setUnidentifiedPage} />
        </div>
      )}

      {/* No files at all */}
      {identified.length === 0 && unidentified.length === 0 && (
        <p className="text-sm text-neutral-400">{t('addMovie.search.noFiles')}</p>
      )}

      {/* Action buttons — always pinned to bottom */}
      {(identified.length > 0 || unidentified.length > 0) && (
        <div className="shrink-0 flex flex-wrap gap-3 mt-auto">
          {identified.length > 0 && (
            <button
              onClick={onAutoAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
            >
              <Plus size={14} />
              {t('addMovie.search.autoAdd', { count: identified.length })}
            </button>
          )}
          {identified.length > 0 && (
            <button
              onClick={onStartReview}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Pencil size={14} />
              {t('addMovie.search.reviewOne')}
            </button>
          )}
          {identified.length === 0 && unidentified.length > 0 && (
            <button
              onClick={onGoToUnidentified}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Pencil size={14} />
              {t('addMovie.search.reviewUnidentified')}
            </button>
          )}
          {unidentified.length > 0 && (
            <button
              onClick={onSaveAllForLater}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Bookmark size={14} />
              {t('addMovie.search.saveForLater', { count: unidentified.length })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PaginationBar ────────────────────────────────────────────────────────────

function PaginationBar({ page, total, onChange }: {
  page: number; total: number; onChange: (p: number) => void
}) {
  if (total <= 1) return null
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-neutral-400 tabular-nums">{page + 1} / {total}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total - 1}
        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─── StepRow ──────────────────────────────────────────────────────────────────

function StepRow({ label, done, active, index, rightText, progress }: {
  label: string; done: boolean; active: boolean
  index: number; rightText: string; progress: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-sm flex items-center gap-1.5 ${active || done ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-600'}`}>
          {done
            ? <CheckCircle2 size={14} className="text-neutral-500" />
            : (
              <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px] font-medium">
                {index}
              </span>
            )}
          {label}
        </span>
        <span className="text-xs text-neutral-400">{rightText}</span>
      </div>
      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-neutral-900 dark:bg-white' : active ? 'bg-neutral-400 dark:bg-neutral-500' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
