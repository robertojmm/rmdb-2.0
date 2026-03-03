import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as schema from './schema'

const dbUrl = process.env['SQLITE_PATH']
if (!dbUrl) throw new Error('SQLITE_PATH is not defined in .env')

const dbDir = dirname(dbUrl)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbUrl, { create: true })
export const db = drizzle(sqlite, { schema })

const migrationsFolder = join(import.meta.dir, '../../drizzle')
if (existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder })
} else {
  console.warn('No migrations folder found. Run "bun run generate" to create migrations.')
}
