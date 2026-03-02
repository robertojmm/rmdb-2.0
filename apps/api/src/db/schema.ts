import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const movies = sqliteTable('movies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  originalTitle: text('original_title'),
  year: integer('year'),
  overview: text('overview'),
  tmdbId: integer('tmdb_id').unique(),
  rating: real('rating'),
  posterPath: text('poster_path'),
  filePath: text('file_path'),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
