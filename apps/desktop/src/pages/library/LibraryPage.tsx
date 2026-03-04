import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, API_URL } from '../../lib/api'
import { MovieModal } from '../../components/MovieModal'

type Movie = Awaited<ReturnType<typeof api.movies.get>>['data']
type MovieList = NonNullable<Movie>
type MovieItem = MovieList[number]

const SIZE_COLS = { small: 8, medium: 5, big: 3 } as const
type GridSize = keyof typeof SIZE_COLS

export function LibraryPage() {
  const { t } = useTranslation()
  const [movies, setMovies] = useState<MovieList>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [size, setSize] = useState<GridSize>('medium')
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null)

  useEffect(() => {
    void (async () => {
      const result = await api.movies.get()
      if (result.error) {
        setError(String(result.error))
      } else {
        setMovies(result.data ?? [])
      }
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('library.title')}</h1>
        <select
          value={size}
          onChange={e => setSize(e.target.value as GridSize)}
          className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
        >
          {(Object.keys(SIZE_COLS) as GridSize[]).map(s => (
            <option key={s} value={s}>{t(`library.size.${s}`)}</option>
          ))}
        </select>
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

      {!loading && !error && movies.length > 0 && (
        <div
          className="grid gap-4 w-full"
          style={{ gridTemplateColumns: `repeat(${SIZE_COLS[size]}, minmax(0, 1fr))` }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group h-[33vh] w-full relative overflow-hidden rounded-lg cursor-pointer"
              onClick={() => setSelectedMovie(movie)}
            >
              <img
                src={movie.posterPath ?? `${API_URL}/assets/default_poster`}
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {selectedMovie && (
        <MovieModal
          movieId={selectedMovie.id}
          initialMovie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onDelete={(id) => {
            setMovies(ms => ms.filter(m => m.id !== id))
            setSelectedMovie(null)
          }}
        />
      )}
    </div>
  )
}
