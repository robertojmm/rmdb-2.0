import { Elysia, t } from 'elysia'
import { scanFoldersService } from './scan-folders.service'

export const scanFoldersRouter = new Elysia({ prefix: '/scan-folders' })
  .get('/', () => scanFoldersService.findAll())
  .post(
    '/',
    ({ body }) => scanFoldersService.create(body.path),
    { body: t.Object({ path: t.String() }) },
  )
  .delete('/:id', ({ params }) => scanFoldersService.delete(Number(params.id)))
