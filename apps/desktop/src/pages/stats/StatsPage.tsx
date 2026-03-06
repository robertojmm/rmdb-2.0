import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Film, Eye, Star, BarChart2 } from 'lucide-react'
import { api, resolvePosterUrl } from '../../lib/api'
import { logger } from '../../lib/logger'

type Stats = NonNullable<Awaited<ReturnType<typeof api.stats.get>>['data']>

const BAR_MAX_PX = 120

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof Film
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex gap-4 items-center">
      <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0">
        <Icon size={20} className="text-neutral-600 dark:text-neutral-300" />
      </div>
      <div>
        <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function HBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-right text-sm text-neutral-500 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
        <div
          className="h-full bg-neutral-900 dark:bg-white rounded transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-sm text-neutral-400 shrink-0 tabular-nums">{count}</span>
    </div>
  )
}

function MovieRow({ title, year, posterPath, right }: {
  title: string
  year: number | null
  posterPath: string | null
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={resolvePosterUrl(posterPath, 'small')}
        alt={title}
        className="w-8 h-12 object-cover rounded shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {year && <p className="text-xs text-neutral-400">{year}</p>}
      </div>
      <div className="shrink-0 text-sm text-neutral-500">{right}</div>
    </div>
  )
}

export function StatsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const result = await api.stats.get()
      if (result.error) {
        logger.error('Failed to load stats', { error: String(result.error) })
      } else {
        setStats(result.data ?? null)
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <p className="text-neutral-400 dark:text-neutral-500">{t('library.loading')}</p>
  if (!stats) return null

  const watchedPct = stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0
  const ratedPct = stats.total > 0 ? Math.round((stats.rated / stats.total) * 100) : 0

  const maxDecade = Math.max(...stats.byDecade.map(d => d.count), 1)
  const maxRating = Math.max(...stats.byRating.map(r => r.count), 1)

  const allRatings = Array.from({ length: 10 }, (_, i) => i + 1).map(r => ({
    rating: r,
    count: stats.byRating.find(b => b.rating === r)?.count ?? 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('stats.title')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Film} label={t('stats.total')} value={String(stats.total)} />
        <StatCard
          icon={Eye}
          label={t('stats.watched')}
          value={String(stats.watched)}
          sub={`${watchedPct}% ${t('stats.ofTotal')}`}
        />
        <StatCard
          icon={Star}
          label={t('stats.avgRating')}
          value={stats.avgRating != null ? String(stats.avgRating) : '—'}
        />
        <StatCard
          icon={BarChart2}
          label={t('stats.rated')}
          value={String(stats.rated)}
          sub={`${ratedPct}% ${t('stats.ofTotal')}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">{t('stats.byDecade')}</p>
          {stats.byDecade.length === 0
            ? <p className="text-sm text-neutral-400">{t('stats.noData')}</p>
            : stats.byDecade.map(d => (
              <HBar key={d.decade} label={`${d.decade}s`} count={d.count} max={maxDecade} />
            ))
          }
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-2">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium mb-1">{t('stats.ratingDist')}</p>
          {stats.byRating.length === 0
            ? <p className="text-sm text-neutral-400">{t('stats.noData')}</p>
            : (
              <div className="flex gap-1 items-end">
                {allRatings.map(r => {
                  const px = maxRating > 0 ? Math.round((r.count / maxRating) * BAR_MAX_PX) : 0
                  return (
                    <div key={r.rating} className="flex-1 flex flex-col items-center gap-1">
                      {r.count > 0 && (
                        <span className="text-xs text-neutral-400 tabular-nums">{r.count}</span>
                      )}
                      <div
                        className="w-full bg-neutral-900 dark:bg-white rounded-t transition-all duration-700"
                        style={{ height: `${Math.max(px, r.count > 0 ? 3 : 0)}px` }}
                      />
                      <span className="text-xs text-neutral-500">{r.rating}</span>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">{t('stats.topRated')}</p>
          {stats.topRated.length === 0
            ? <p className="text-sm text-neutral-400">{t('stats.noData')}</p>
            : stats.topRated.map(m => (
              <MovieRow
                key={m.id}
                title={m.title}
                year={m.year}
                posterPath={m.posterPath}
                right={<span className="font-medium">★ {m.rating}</span>}
              />
            ))
          }
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">{t('stats.recentlyWatched')}</p>
          {stats.recentlyWatched.length === 0
            ? <p className="text-sm text-neutral-400">{t('stats.noData')}</p>
            : stats.recentlyWatched.map(m => (
              <MovieRow
                key={m.id}
                title={m.title}
                year={m.year}
                posterPath={m.posterPath}
                right={m.watchedAt ? new Date(m.watchedAt).toLocaleDateString() : ''}
              />
            ))
          }
        </div>
      </div>
    </div>
  )
}
