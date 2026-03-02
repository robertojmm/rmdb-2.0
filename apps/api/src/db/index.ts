import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

const dbUrl = process.env['SQLITE_PATH']
if (!dbUrl) throw new Error('SQLITE_PATH is not defined in .env')

const sqlite = new Database(dbUrl, { create: true })

export const db = drizzle(sqlite, { schema })
