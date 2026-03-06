import { Elysia } from 'elysia'
import { db } from '@db'
import { movies } from '@db/schema'
import { count, avg, sql, isNotNull, desc } from 'drizzle-orm'

export const statsRouter = new Elysia({ prefix: '/stats' })
  .get('/', async () => {
    const [totals] = await db
      .select({
        total: count(),
        watched: sql<number>`SUM(CASE WHEN ${movies.watched} = 1 THEN 1 ELSE 0 END)`,
        rated: sql<number>`COUNT(${movies.rating})`,
        avgRating: avg(movies.rating),
      })
      .from(movies)

    const byDecade = await db
      .select({
        decade: sql<number>`(${movies.year} / 10) * 10`,
        count: count(),
      })
      .from(movies)
      .where(isNotNull(movies.year))
      .groupBy(sql`(${movies.year} / 10) * 10`)
      .orderBy(sql`(${movies.year} / 10) * 10`)

    const byRating = await db
      .select({
        rating: sql<number>`ROUND(${movies.rating})`,
        count: count(),
      })
      .from(movies)
      .where(isNotNull(movies.rating))
      .groupBy(sql`ROUND(${movies.rating})`)
      .orderBy(sql`ROUND(${movies.rating})`)

    const topRated = await db
      .select({
        id: movies.id,
        title: movies.title,
        year: movies.year,
        rating: movies.rating,
        posterPath: movies.posterPath,
      })
      .from(movies)
      .where(isNotNull(movies.rating))
      .orderBy(desc(movies.rating))
      .limit(5)

    const recentlyWatched = await db
      .select({
        id: movies.id,
        title: movies.title,
        year: movies.year,
        watchedAt: movies.watchedAt,
        posterPath: movies.posterPath,
      })
      .from(movies)
      .where(isNotNull(movies.watchedAt))
      .orderBy(desc(movies.watchedAt))
      .limit(5)

    return {
      total: totals?.total ?? 0,
      watched: Number(totals?.watched ?? 0),
      rated: Number(totals?.rated ?? 0),
      avgRating: totals?.avgRating != null ? Math.round(Number(totals.avgRating) * 10) / 10 : null,
      byDecade: byDecade.map(r => ({ decade: Number(r.decade), count: r.count })),
      byRating: byRating.map(r => ({ rating: Number(r.rating), count: r.count })),
      topRated,
      recentlyWatched,
    }
  })
