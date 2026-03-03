import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, API_URL } from '../../lib/api'
import { MovieModal } from '../../components/MovieModal'

type Movie = Awaited<ReturnType<typeof api.movies.get>>['data']
type MovieList = NonNullable<Movie>
type MovieItem = MovieList[number]

const MIN_COLS = 3
const MAX_COLS = 10

export function LibraryPage() {
  const { t } = useTranslation()
  const [movies, setMovies] = useState<MovieList>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cols, setCols] = useState(5)
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
        <input
          type="range"
          min={MIN_COLS}
          max={MAX_COLS}
          value={MAX_COLS + MIN_COLS - cols}
          onChange={(e) => setCols(MAX_COLS + MIN_COLS - Number(e.target.value))}
          className="w-32 accent-neutral-500 cursor-pointer"
        />
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
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
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
        />
      )}
    </div>
  )
}
