import { Elysia, t } from 'elysia'
import { moviesService } from './movies.service'
import { downloadPoster, deletePoster } from './poster.service'

export const moviesRouter = new Elysia({ prefix: '/movies' })
  .get('/', () => moviesService.findAll())
  .get('/:id', ({ params }) => moviesService.findById(Number(params.id)))
  .post(
    '/',
    async ({ body }) => {
      const { posterPath: externalUrl, ...rest } = body
      const movie = await moviesService.create({ ...rest, posterPath: externalUrl })
      if (!movie) { console.error('[movies] create returned undefined'); return null }
      console.log(`[movies] Created movie ${movie.id} — externalUrl: ${externalUrl ?? 'none'}`)
      if (externalUrl) {
        const localPath = await downloadPoster(movie.id, externalUrl)
        console.log(`[movies] downloadPoster result for ${movie.id}: ${localPath ?? 'null (failed)'}`)
        if (localPath) return moviesService.update(movie.id, { posterPath: localPath })
      }
      return movie
    },
    {
      body: t.Object({
        title: t.String(),
        originalTitle: t.Optional(t.String()),
        year: t.Optional(t.Integer()),
        overview: t.Optional(t.String()),
        tmdbId: t.Optional(t.Integer()),
        rating: t.Optional(t.Number()),
        posterPath: t.Optional(t.String()),
        filePath: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    '/:id',
    ({ params, body }) => moviesService.update(Number(params.id), body),
    {
      body: t.Object({
        title: t.Optional(t.String()),
        originalTitle: t.Optional(t.String()),
        year: t.Optional(t.Integer()),
        overview: t.Optional(t.String()),
        tmdbId: t.Optional(t.Integer()),
        rating: t.Optional(t.Number()),
        posterPath: t.Optional(t.String()),
        filePath: t.Optional(t.String()),
      }),
    },
  )
  .delete('/:id', ({ params }) => {
    const id = Number(params.id)
    deletePoster(id)
    return moviesService.delete(id)
  })
