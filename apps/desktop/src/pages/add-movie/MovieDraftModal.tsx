import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, Star, FolderOpen } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { api, API_URL } from '../../lib/api'
import type { SearchResult } from './ApiPanel'

const inputClass =
  'w-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500'

function StarRating({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const current = hovered ?? (value ? Number(value) : 0)
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(null)}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n === Number(value) ? '' : String(n))}
          className="text-neutral-300 dark:text-neutral-600 hover:scale-110 transition-transform"
        >
          <Star size={16} className={n <= current ? 'fill-yellow-400 text-yellow-400' : ''} />
        </button>
      ))}
    </div>
  )
}

interface Props {
  draft: SearchResult
  initialFilePath?: string
  onClose: () => void
  onSaved: (externalId: string) => void
}

export function MovieDraftModal({ draft, initialFilePath, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: draft.title,
    originalTitle: draft.originalTitle ?? '',
    year: draft.year?.toString() ?? '',
    overview: draft.overview ?? '',
    rating: draft.rating?.toString() ?? '',
    tmdbId: draft.tmdbId?.toString() ?? '',
    posterPath: draft.posterUrl ?? '',
    filePath: initialFilePath ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSave() {
    if (!form.title) return
    setSaving(true)
    const result = await api.movies.post({
      title: form.title,
      originalTitle: form.originalTitle || undefined,
      year: form.year ? Number(form.year) : undefined,
      overview: form.overview || undefined,
      rating: form.rating ? Number(form.rating) : undefined,
      posterPath: form.posterPath || undefined,
      filePath: form.filePath || undefined,
      tmdbId: form.tmdbId ? Number(form.tmdbId) : undefined,
    })
    setSaving(false)
    if (result.data) onSaved(draft.externalId)
  }

  const posterSrc = form.posterPath || `${API_URL}/assets/default_poster`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex gap-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-6 p-8 max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Poster */}
        <div className="shrink-0 w-56 flex flex-col gap-2">
          <div className="w-56 h-80 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <img
              src={posterSrc}
              alt={form.title}
              className="w-full h-full object-contain"
            />
          </div>
          <input
            className={inputClass}
            placeholder="Poster URL"
            value={form.posterPath}
            onChange={e => setForm(f => ({ ...f, posterPath: e.target.value }))}
          />
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 min-w-0 flex-1 pr-6 py-2 overflow-y-auto">
          <input
            className={`${inputClass} text-base font-bold`}
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="Original title"
            value={form.originalTitle}
            onChange={e => setForm(f => ({ ...f, originalTitle: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <div className="w-20 shrink-0">
              <input
                className={inputClass}
                placeholder="Year"
                type="number"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              />
            </div>
            <StarRating
              value={form.rating}
              onChange={(v) => setForm(f => ({ ...f, rating: v }))}
            />
          </div>
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="Overview"
            rows={5}
            value={form.overview}
            onChange={e => setForm(f => ({ ...f, overview: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="File path"
              value={form.filePath}
              onChange={e => setForm(f => ({ ...f, filePath: e.target.value }))}
            />
            <button
              type="button"
              onClick={async () => {
                const selected = await open({ multiple: false, directory: false })
                if (typeof selected === 'string') setForm(f => ({ ...f, filePath: selected }))
              }}
              className="shrink-0 px-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <FolderOpen size={15} />
            </button>
          </div>
          <div className="flex gap-2 mt-auto pt-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving || !form.title}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Check size={14} />
              {t('addMovie.manual.addToLibrary')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              {t('settings.movieApis.modal.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
