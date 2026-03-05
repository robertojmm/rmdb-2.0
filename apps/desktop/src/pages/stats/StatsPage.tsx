import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Film, Eye, Star, BarChart2 } from 'lucide-react'
import { api } from '../../lib/api'
import { logger } from '../../lib/logger'

type Stats = Awaited<ReturnType<typeof api.stats.get>>['data']

function StatCard({ icon: Icon, label, value, sub }: {
  icon: typeof Film
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex gap-4 items-center">
      <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
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
      <span className="w-7 text-sm text-neutral-400 shrink-0">{count}</span>
    </div>
  )
}

function VBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
      {count > 0 && (
        <span className="text-xs text-neutral-400">{count}</span>
      )}
      <div className="w-full flex-1 flex items-end">
        <div
          className="w-full bg-neutral-900 dark:bg-white rounded-t transition-all duration-700"
          style={{ height: `${pct}%`, minHeight: pct > 0 ? '4px' : '0' }}
        />
      </div>
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  )
}

export function StatsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>(null)
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Film}
          label={t('stats.total')}
          value={String(stats.total)}
        />
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

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-medium">{t('stats.ratingDist')}</p>
          {stats.byRating.length === 0
            ? <p className="text-sm text-neutral-400">{t('stats.noData')}</p>
            : (
              <div className="flex gap-1 h-36 items-end">
                {allRatings.map(r => (
                  <VBar key={r.rating} label={String(r.rating)} count={r.count} max={maxRating} />
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
