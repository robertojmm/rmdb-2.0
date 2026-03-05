import { Elysia, t } from 'elysia'
import { db } from '@db'
import { movieDrafts } from '@db/schema'
import { eq, desc } from 'drizzle-orm'
import { logger } from '../logger'

export const movieDraftsRouter = new Elysia({ prefix: '/movie-drafts' })
  .get('/', () =>
    db.select().from(movieDrafts).orderBy(desc(movieDrafts.savedAt))
  )
  .post(
    '/',
    async ({ body }) => {
      const result = await db.insert(movieDrafts)
        .values(body)
        .onConflictDoNothing()
        .returning()
        .then(r => r[0] ?? null)
      if (result) logger.info('Movie draft created', { id: result.id, filePath: body.filePath, parsedTitle: body.parsedTitle })
      return result
    },
    {
      body: t.Object({
        filePath: t.String(),
        parsedTitle: t.Optional(t.Nullable(t.String())),
        parsedYear: t.Optional(t.Nullable(t.Integer())),
      }),
    }
  )
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id)
    const result = await db.delete(movieDrafts).where(eq(movieDrafts.id, id))
    logger.info('Movie draft deleted', { id })
    return result
  })
