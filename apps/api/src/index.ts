import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { join } from 'node:path'
import { moviesRouter } from '@movies/movies.router'
import { apiSourcesRouter } from '@api-sources/api-sources.router'
import { scanFoldersRouter } from '@scan-folders/scan-folders.router'
import { scanRouter } from './scan/scan.router'
import { version } from '../package.json'
import { config } from './config'

const app = new Elysia()
  .use(cors({
    origin: "*"
  }))
  .get('/health', () => ({ status: 'ok', version }))
  .get('/config', () => ({ dbPath: config.dbPath }))
  .get('/assets/default_poster', () => Bun.file(join(import.meta.dir, '../public/default_poster.jpg')))
  .use(moviesRouter)
  .use(apiSourcesRouter)
  .use(scanFoldersRouter)
  .use(scanRouter)
  .listen({
    hostname: "0.0.0.0",
    port: 3000
  })

console.log(`API version ${version} running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
