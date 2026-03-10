import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as schema from './schema'
import { config } from '../config'
import { runEmbeddedMigrations } from './embedded-migrations'

const dbUrl = config.dbPath

const dbDir = dirname(dbUrl)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbUrl, { create: true })
export const db = drizzle(sqlite, { schema })

// In a compiled Bun binary, import.meta.dir is a virtual path — use the real
// exe directory instead. In dev mode, fall back to the source tree location.
const migrationsByExec = join(dirname(process.execPath), 'drizzle')
const migrationsByMeta = join(import.meta.dir, '../../drizzle')

if (existsSync(migrationsByExec)) {
  migrate(db, { migrationsFolder: migrationsByExec })
  console.log(`Migrations applied from ${migrationsByExec}`)
} else if (existsSync(migrationsByMeta)) {
  migrate(db, { migrationsFolder: migrationsByMeta })
  console.log(`Migrations applied from ${migrationsByMeta}`)
} else {
  // Fallback: run SQL embedded in the binary (compatible with Drizzle's hash format)
  runEmbeddedMigrations(sqlite)
}
