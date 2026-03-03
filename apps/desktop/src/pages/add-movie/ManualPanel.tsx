import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { API_URL, api } from '../../lib/api'

type Form = {
  title: string
  originalTitle: string
  year: string
  overview: string
  rating: string
  posterPath: string
  filePath: string
}

const empty: Form = {
  title: '', originalTitle: '', year: '',
  overview: '', rating: '', posterPath: '', filePath: '',
}

const inputClass =
  'w-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500'

export function ManualPanel() {
  const { t } = useTranslation()
  const [form, setForm] = useState<Form>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!form.title.trim()) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const result = await api.movies.post({
      title: form.title.trim(),
      originalTitle: form.originalTitle.trim() || undefined,
      year: form.year ? parseInt(form.year) : undefined,
      overview: form.overview.trim() || undefined,
      rating: form.rating ? parseFloat(form.rating) : undefined,
      posterPath: form.posterPath.trim() || undefined,
      filePath: form.filePath.trim() || undefined,
    })

    setSaving(false)
    if (result.error) {
      setError(String(result.error.value))
    } else {
      setForm(empty)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="flex gap-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
      {/* Poster */}
      <div className="shrink-0 w-48 flex flex-col gap-2">
        <div className="w-48 h-72 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={form.posterPath || `${API_URL}/assets/default_poster`}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
        <input
          className={inputClass}
          placeholder="Poster URL"
          value={form.posterPath}
          onChange={set('posterPath')}
        />
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <input
          className={`${inputClass} text-base font-bold`}
          placeholder="Title"
          value={form.title}
          onChange={set('title')}
        />
        <input
          className={inputClass}
          placeholder="Original title"
          value={form.originalTitle}
          onChange={set('originalTitle')}
        />
        <div className="flex gap-3">
          <input
            className={inputClass}
            placeholder="Year"
            type="number"
            value={form.year}
            onChange={set('year')}
          />
          <input
            className={inputClass}
            placeholder="Rating (0–10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={form.rating}
            onChange={set('rating')}
          />
        </div>
        <textarea
          className={`${inputClass} resize-none`}
          placeholder="Overview"
          rows={5}
          value={form.overview}
          onChange={set('overview')}
        />
        <input
          className={inputClass}
          placeholder="File path"
          value={form.filePath}
          onChange={set('filePath')}
        />
        <div className="flex items-center gap-3 mt-auto pt-2">
          <button
            onClick={() => void submit()}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            {saving ? '...' : t('addMovie.manual.addToLibrary')}
          </button>
          <button
            onClick={() => { setForm(empty); setError(null); setSaved(false) }}
            className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {t('addMovie.manual.clear')}
          </button>
          {saved && (
            <span className="text-xs text-green-600 dark:text-green-400">
              {t('addMovie.manual.addToLibrary')} ✓
            </span>
          )}
          {error && (
            <span className="text-xs text-red-500 truncate">{error}</span>
          )}
        </div>
      </div>
    </div>
  )
}
