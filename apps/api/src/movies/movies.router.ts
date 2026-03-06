import { Elysia, t } from 'elysia'
import { moviesService } from './movies.service'
import { downloadPoster, deletePoster } from './poster.service'
import { logger } from '../logger'

export const moviesRouter = new Elysia({ prefix: '/movies' })
  .get('/', () => moviesService.findAll())
  .get('/:id', ({ params }) => moviesService.findById(Number(params.id)))
  .post(
    '/',
    async ({ body }) => {
      const { posterPath: externalUrl, ...rest } = body
      const movie = await moviesService.create({ ...rest, posterPath: externalUrl })
      if (!movie) {
        logger.error('Movie creation returned undefined', { title: body.title })
        return null
      }
      logger.info('Movie created', { id: movie.id, title: movie.title, year: movie.year })
      if (externalUrl) {
        const localPath = await downloadPoster(movie.id, externalUrl)
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
        watched: t.Optional(t.Boolean()),
      }),
    },
  )
  .patch(
    '/:id',
    ({ params, body }) => {
      const update = { ...body }
      if (body.watched === true) Object.assign(update, { watchedAt: new Date() })
      else if (body.watched === false) Object.assign(update, { watchedAt: null })
      return moviesService.update(Number(params.id), update)
    },
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
        watched: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id)
    deletePoster(id)
    const result = await moviesService.delete(id)
    logger.info('Movie deleted', { id })
    return result
  })
