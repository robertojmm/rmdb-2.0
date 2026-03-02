import { eq } from 'drizzle-orm'
import { db } from '@db'
import { movies } from '@db/schema'

type NewMovie = Omit<typeof movies.$inferInsert, 'id' | 'addedAt'>

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

  delete: (id: number) => db.delete(movies).where(eq(movies.id, id)),
}
