import { Elysia, t } from 'elysia'
import { db } from '@db'
import { movieDrafts } from '@db/schema'
import { eq, desc } from 'drizzle-orm'

export const movieDraftsRouter = new Elysia({ prefix: '/movie-drafts' })
  .get('/', () =>
    db.select().from(movieDrafts).orderBy(desc(movieDrafts.savedAt))
  )
  .post(
    '/',
    ({ body }) =>
      db.insert(movieDrafts)
        .values(body)
        .onConflictDoNothing()
        .returning()
        .then(r => r[0] ?? null),
    {
      body: t.Object({
        filePath: t.String(),
        parsedTitle: t.Optional(t.Nullable(t.String())),
        parsedYear: t.Optional(t.Nullable(t.Integer())),
      }),
    }
  )
  .delete('/:id', ({ params }) =>
    db.delete(movieDrafts).where(eq(movieDrafts.id, Number(params.id)))
  )
