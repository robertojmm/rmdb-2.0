import { eq } from 'drizzle-orm'
import { db } from '@db'
import { apiSources } from '@db/schema'
import { getAdapter } from './adapters'

type ApiSourceRow = typeof apiSources.$inferSelect

function toResponse(row: ApiSourceRow) {
  const apiKey = row.configuration
    ? (JSON.parse(row.configuration) as { apiKey?: string }).apiKey ?? null
    : null
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    needsConfiguration: row.needsConfiguration,
    apiKey,
  }
}

export const apiSourcesService = {
  findAll: () =>
    db.select().from(apiSources).then(rows => rows.map(toResponse)),

  findById: (id: number) =>
    db.select().from(apiSources).where(eq(apiSources.id, id))
      .then(rows => rows[0] ? toResponse(rows[0]) : null),

  updateApiKey: (id: number, apiKey: string | null) => {
    const configuration = apiKey ? JSON.stringify({ apiKey }) : null
    return db.update(apiSources)
      .set({ configuration })
      .where(eq(apiSources.id, id))
      .returning()
      .then(rows => rows[0] ? toResponse(rows[0]) : null)
  },

  search: async (id: number, query: string) => {
    const rows = await db.select().from(apiSources).where(eq(apiSources.id, id))
    const source = rows[0]
    if (!source) throw new Error('API source not found')

    const adapter = getAdapter(source.url)
    if (!adapter) throw new Error('No adapter available for this source')

    const apiKey = source.configuration
      ? (JSON.parse(source.configuration) as { apiKey?: string }).apiKey ?? null
      : null

    return adapter.search(query, apiKey, id)
  },
}
