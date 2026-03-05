import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { join } from 'node:path'
import { moviesRouter } from '@movies/movies.router'
import { apiSourcesRouter } from '@api-sources/api-sources.router'
import { scanFoldersRouter } from '@scan-folders/scan-folders.router'
import { scanRouter } from './scan/scan.router'
import { movieDraftsRouter } from './movie-drafts/movie-drafts.router'
import { statsRouter } from './stats/stats.router'
import { postersDir } from '@movies/poster.service'
import { version } from '../package.json'
import { config } from './config'
import { logger } from './logger'

const app = new Elysia()
  .use(cors({
    origin: "*"
  }))
  .onError(({ error, request }) => {
    logger.error(`Unhandled error on ${request.method} ${new URL(request.url).pathname}`, {
      message: error.message,
      stack: error.stack,
    })
  })
  .get('/health', () => ({ status: 'ok', version }))
  .get('/config', () => ({ dbPath: config.dbPath }))
  .post(
    '/log',
    ({ body }) => {
      const { level, message, context } = body
      if (level === 'ERROR') {
        logger.frontend.error(message, context)
      } else {
        logger.frontend.info(message, context)
      }
      return { ok: true }
    },
    {
      body: t.Object({
        level: t.Union([t.Literal('INFO'), t.Literal('ERROR')]),
        message: t.String(),
        context: t.Optional(t.Unknown()),
      }),
    }
  )
  .get('/assets/default_poster', () => Bun.file(join(import.meta.dir, '../public/default_poster.jpg')))
  .get('/assets/posters/:filename', async ({ params }) => {
    const file = Bun.file(join(postersDir, params.filename))
    return await file.exists() ? file : new Response(null, { status: 404 })
  })
  .use(moviesRouter)
  .use(apiSourcesRouter)
  .use(scanFoldersRouter)
  .use(scanRouter)
  .use(movieDraftsRouter)
  .use(statsRouter)
  .listen({
    hostname: "0.0.0.0",
    port: 3000
  })

logger.info(`API version ${version} started on http://${app.server?.hostname}:${app.server?.port}`)
console.log(`API version ${version} running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
