import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const apiSources = sqliteTable('api_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  needsConfiguration: integer('needs_configuration', { mode: 'boolean' }).notNull().default(false),
  configuration: text('configuration'),
})

export const scanFolders = sqliteTable('scan_folders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull().unique(),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

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
  watched: integer('watched', { mode: 'boolean' }).notNull().default(false),
  watchedAt: integer('watched_at', { mode: 'timestamp' }),
  addedAt: integer('added_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const movieDrafts = sqliteTable('movie_drafts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filePath: text('file_path').notNull().unique(),
  parsedTitle: text('parsed_title'),
  parsedYear: integer('parsed_year'),
  savedAt: integer('saved_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
