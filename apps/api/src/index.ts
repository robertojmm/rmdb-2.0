import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { join } from 'node:path'
import { moviesRouter } from '@movies/movies.router'
import { version } from '../package.json'

const app = new Elysia()
  .use(cors({
    origin: "*"
  }))
  .get('/health', () => ({ status: 'ok', version }))
  .get('/assets/default_cover', () => Bun.file(join(import.meta.dir, '../public/default_cover.jpg')))
  .use(moviesRouter)
  .listen({
    hostname: "0.0.0.0",
    port: 3000
  })

console.log(`API version ${version} running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
