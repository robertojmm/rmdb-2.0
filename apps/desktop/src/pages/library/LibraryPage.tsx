import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronUp, Search, X } from 'lucide-react'
import { api, resolvePosterUrl } from '../../lib/api'
import { MovieModal } from '../../components/MovieModal'
import { logger } from '../../lib/logger'

type Movie = Awaited<ReturnType<typeof api.movies.get>>['data']
type MovieList = NonNullable<Movie>
type MovieItem = MovieList[number]

const SIZE_MIN_WIDTH = { small: '130px', medium: '190px', big: '280px' } as const
type GridSize = keyof typeof SIZE_MIN_WIDTH

type SortKey = 'alpha' | 'rating' | 'newest' | 'oldest'
type FilterKey = 'all' | 'watched' | 'unwatched'

function filterMovies(movies: MovieList, filter: FilterKey, query: string): MovieList {
  let result = movies
  if (filter === 'watched') result = result.filter(m => m.watched)
  else if (filter === 'unwatched') result = result.filter(m => !m.watched)
  if (query) {
    const q = query.toLowerCase()
    result = result.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.originalTitle?.toLowerCase().includes(q) ?? false) ||
      (m.year?.toString().includes(q) ?? false)
    )
  }
  return result
}

function sortMovies(movies: MovieList, sort: SortKey): MovieList {
  const sorted = [...movies]
  if (sort === 'alpha') return sorted.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'rating') return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  if (sort === 'newest') return sorted.sort((a, b) => b.id - a.id)
  return sorted.sort((a, b) => a.id - b.id)
}

export function LibraryPage() {
  const { t } = useTranslation()
  const [movies, setMovies] = useState<MovieList>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<GridSize>('medium')
  const [sort, setSort] = useState<SortKey>('newest')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const onScroll = () => setShowScrollTop(main.scrollTop > 400)
    main.addEventListener('scroll', onScroll)
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    void (async () => {
      const result = await api.movies.get()
      if (result.error) {
        logger.error('Failed to load library', { error: String(result.error) })
        setError(String(result.error))
      } else {
        setMovies(result.data ?? [])
      }
      setLoading(false)
    })()
  }, [])

  const visibleMovies = sortMovies(filterMovies(movies, filter, query), sort)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold shrink-0">{t('library.title')}</h1>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('library.search')}
              className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-8 pr-7 py-1.5 w-52 focus:outline-none focus:w-72 transition-all duration-200 placeholder:text-neutral-400"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as FilterKey)}
            className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {(['all', 'watched', 'unwatched'] as FilterKey[]).map(f => (
              <option key={f} value={f}>{t(`library.filter.${f}`)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {(['alpha', 'rating', 'newest', 'oldest'] as SortKey[]).map(s => (
              <option key={s} value={s}>{t(`library.sort.${s}`)}</option>
            ))}
          </select>
          <select
            value={size}
            onChange={e => setSize(e.target.value as GridSize)}
            className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {(Object.keys(SIZE_MIN_WIDTH) as GridSize[]).map(s => (
              <option key={s} value={s}>{t(`library.size.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-neutral-400 dark:text-neutral-500">{t('library.loading')}</p>
      )}

      {error && (
        <p className="text-red-500">{t('library.error')}</p>
      )}

      {!loading && !error && movies.length === 0 && (
        <p className="text-neutral-400 dark:text-neutral-500">{t('library.empty')}</p>
      )}

      {!loading && !error && movies.length > 0 && visibleMovies.length === 0 && (
        <p className="text-neutral-400 dark:text-neutral-500">{t('library.noResults')}</p>
      )}

      {!loading && !error && visibleMovies.length > 0 && (
        <div
          className="grid gap-2 w-full"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${SIZE_MIN_WIDTH[size]}, 1fr))` }}
        >
          {visibleMovies.map((movie) => (
            <div
              key={movie.id}
              className="group aspect-[2/3] w-full relative overflow-hidden rounded-lg cursor-pointer"
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
              onClick={() => setSelectedMovie(movie)}
            >
              <img
                src={resolvePosterUrl(movie.posterPath, size)}
                alt={movie.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full shadow-lg hover:opacity-80 transition-opacity z-40"
        >
          <ChevronUp size={20} />
        </button>
      )}

      {selectedMovie && (
        <MovieModal
          movieId={selectedMovie.id}
          initialMovie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onUpdate={(updated) => setMovies(ms => ms.map(m => m.id === updated.id ? updated : m))}
          onDelete={(id) => {
            setMovies(ms => ms.filter(m => m.id !== id))
            setSelectedMovie(null)
          }}
        />
      )}
    </div>
  )
}
