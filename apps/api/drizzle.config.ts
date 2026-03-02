import { defineConfig } from 'drizzle-kit'

const dbUrl = process.env['SQLITE_PATH']
if (!dbUrl) {
  throw new Error('SQLITE_PATH is not defined in .env')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
})
