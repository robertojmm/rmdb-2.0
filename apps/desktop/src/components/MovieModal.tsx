import { useEffect, useState } from 'react'
import { X, Star, Calendar, Film, Pencil, Check, Trash2 } from 'lucide-react'
import { api, API_URL } from '../lib/api'

type MovieItem = NonNullable<Awaited<ReturnType<typeof api.movies.get>>['data']>[number]
type MovieDetail = NonNullable<Awaited<ReturnType<typeof api.movies[string]['get']>>['data']>

type MovieForm = {
  title: string
  originalTitle: string
  year: string
  overview: string
  rating: string
  tmdbId: string
  posterPath: string
  filePath: string
}

interface MovieModalProps {
  movieId: number
  initialMovie: MovieItem
  onClose: () => void
  onDelete: (id: number) => void
}

const inputClass =
  'w-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500'

export function MovieModal({ movieId, initialMovie, onClose, onDelete }: MovieModalProps) {
  const [movie, setMovie] = useState<MovieDetail>(initialMovie)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<MovieForm>({
    title: '',
    originalTitle: '',
    year: '',
    overview: '',
    rating: '',
    tmdbId: '',
    posterPath: '',
    filePath: '',
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(false)
        else if (isEditing) setIsEditing(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, isEditing, confirmDelete])

  useEffect(() => {
    void (async () => {
      const result = await api.movies[String(movieId)].get()
      if (result.data) setMovie(result.data)
    })()
  }, [movieId])

  function startEditing() {
    setForm({
      title: movie.title,
      originalTitle: movie.originalTitle ?? '',
      year: movie.year?.toString() ?? '',
      overview: movie.overview ?? '',
      rating: movie.rating?.toString() ?? '',
      tmdbId: movie.tmdbId?.toString() ?? '',
      posterPath: movie.posterPath ?? '',
      filePath: movie.filePath ?? '',
    })
    setIsEditing(true)
  }

  async function saveEdit() {
    const result = await api.movies[String(movieId)].patch({
      title: form.title || undefined,
      originalTitle: form.originalTitle || undefined,
      year: form.year ? Number(form.year) : undefined,
      overview: form.overview || undefined,
      rating: form.rating ? Number(form.rating) : undefined,
      tmdbId: form.tmdbId ? Number(form.tmdbId) : undefined,
      posterPath: form.posterPath || undefined,
      filePath: form.filePath || undefined,
    })
    if (result.data) setMovie(result.data)
    setIsEditing(false)
  }

  async function deleteMovie() {
    await api.movies[String(movieId)].delete()
    onDelete(movieId)
  }

  const posterSrc = isEditing
    ? (form.posterPath || `${API_URL}/assets/default_poster`)
    : (movie.posterPath ?? `${API_URL}/assets/default_poster`)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={isEditing ? undefined : onClose}
    >
      <div
        className="relative flex gap-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-6 p-8 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <X size={20} />
        </button>

        {!isEditing && (
          <button
            onClick={startEditing}
            className="absolute top-4 right-12 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <Pencil size={18} />
          </button>
        )}

        {/* Poster */}
        <div className="shrink-0 w-56 flex flex-col gap-2">
          <div className="w-56 h-80 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <img
              src={posterSrc}
              alt={movie.title}
              className="w-full h-full object-contain"
            />
          </div>
          {isEditing && (
            <input
              className={inputClass}
              placeholder="Poster URL"
              value={form.posterPath}
              onChange={(e) => setForm((f) => ({ ...f, posterPath: e.target.value }))}
            />
          )}
        </div>

        {/* View mode */}
        {!isEditing && (
          <div className="flex flex-col gap-4 min-w-0 pr-6 py-2 flex-1">
            <div>
              <h2 className="text-2xl font-bold leading-tight">{movie.title}</h2>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-sm text-neutral-500 mt-0.5">{movie.originalTitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-neutral-500">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {movie.year}
                </span>
              )}
              {movie.rating && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {movie.rating}
                </span>
              )}
            </div>

            {movie.overview && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed overflow-y-auto">
                {movie.overview}
              </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-2">
              {movie.filePath ? (
                <p className="flex items-center gap-1.5 text-xs text-neutral-400 truncate min-w-0">
                  <Film size={12} className="shrink-0" />
                  {movie.filePath}
                </p>
              ) : <span />}

              {confirmDelete ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-500">Borrar definitivamente?</span>
                  <button
                    onClick={() => void deleteMovie()}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    Sí, borrar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="shrink-0 text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="flex flex-col gap-3 min-w-0 flex-1 pr-6 py-2 overflow-y-auto">
            <input
              className={`${inputClass} text-base font-bold`}
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="Original title"
              value={form.originalTitle}
              onChange={(e) => setForm((f) => ({ ...f, originalTitle: e.target.value }))}
            />
            <div className="flex gap-3">
              <input
                className={inputClass}
                placeholder="Year"
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Rating (0–10)"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              />
            </div>
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="Overview"
              rows={5}
              value={form.overview}
              onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="File path"
              value={form.filePath}
              onChange={(e) => setForm((f) => ({ ...f, filePath: e.target.value }))}
            />
            <div className="flex gap-2 mt-auto pt-2">
              <button
                onClick={() => void saveEdit()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:opacity-80 transition-opacity"
              >
                <Check size={14} />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
