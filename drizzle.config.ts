import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/main/db/schema.ts',
  out: './src/drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db' // This is only for the CLI/migrations
  }
})
