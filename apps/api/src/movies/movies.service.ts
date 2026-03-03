import { eq } from 'drizzle-orm'
import { db } from '@db'
import { movies } from '@db/schema'

type NewMovie = Omit<typeof movies.$inferInsert, 'id' | 'addedAt'>
type MovieUpdate = Partial<NewMovie>

export const moviesService = {
  findAll: () => db.select().from(movies),

  findById: (id: number) =>
    db
      .select()
      .from(movies)
      .where(eq(movies.id, id))
      .then((r) => r[0] ?? null),

  create: (data: NewMovie) =>
    db
      .insert(movies)
      .values(data)
      .returning()
      .then((r) => r[0]),

  update: (id: number, data: MovieUpdate) =>
    db
      .update(movies)
      .set(data)
      .where(eq(movies.id, id))
      .returning()
      .then((r) => r[0] ?? null),

  delete: (id: number) => db.delete(movies).where(eq(movies.id, id)),
}
