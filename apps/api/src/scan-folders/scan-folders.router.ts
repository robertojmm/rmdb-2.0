import { Elysia, t } from 'elysia'
import { scanFoldersService } from './scan-folders.service'
import { logger } from '../logger'

export const scanFoldersRouter = new Elysia({ prefix: '/scan-folders' })
  .get('/', () => scanFoldersService.findAll())
  .post(
    '/',
    async ({ body }) => {
      const result = await scanFoldersService.create(body.path)
      logger.info('Scan folder added', { path: body.path })
      return result
    },
    { body: t.Object({ path: t.String() }) },
  )
  .delete('/:id', async ({ params }) => {
    const id = Number(params.id)
    const result = await scanFoldersService.delete(id)
    logger.info('Scan folder removed', { id })
    return result
  })
