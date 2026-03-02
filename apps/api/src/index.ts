import { Elysia } from 'elysia'
import { moviesRouter } from '@movies/movies.router'

const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .use(moviesRouter)
  .listen(3000)

console.log(`API running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
