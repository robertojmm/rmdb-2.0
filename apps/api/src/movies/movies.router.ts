import { Elysia, t } from 'elysia'
import { moviesService } from './movies.service'

export const moviesRouter = new Elysia({ prefix: '/movies' })
  .get('/', () => moviesService.findAll())
  .get('/:id', ({ params }) => moviesService.findById(Number(params.id)))
  .post(
    '/',
    ({ body }) => moviesService.create(body),
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
  .delete('/:id', ({ params }) => moviesService.delete(Number(params.id)))
