import { Elysia, t } from 'elysia'
import { apiSourcesService } from './api-sources.service'

export const apiSourcesRouter = new Elysia({ prefix: '/api-sources' })
  .get('/', () => apiSourcesService.findAll())
  .get(
    '/:id/search',
    ({ params, query }) => apiSourcesService.search(Number(params.id), query.q),
    {
      query: t.Object({ q: t.String() }),
    },
  )
  .patch(
    '/:id',
    ({ params, body }) => apiSourcesService.updateApiKey(Number(params.id), body.apiKey),
    {
      body: t.Object({
        apiKey: t.Nullable(t.String()),
      }),
    },
  )
