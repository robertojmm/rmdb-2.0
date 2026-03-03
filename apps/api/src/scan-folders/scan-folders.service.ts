import { eq } from 'drizzle-orm'
import { db } from '@db'
import { scanFolders } from '@db/schema'

export const scanFoldersService = {
  findAll: () => db.select().from(scanFolders),

  create: (path: string) =>
    db.insert(scanFolders).values({ path }).returning().then(r => r[0]),

  delete: (id: number) => db.delete(scanFolders).where(eq(scanFolders.id, id)),
}
