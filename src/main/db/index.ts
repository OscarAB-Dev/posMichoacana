// src/main/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import * as schema from './schema'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

// In production, use the standard app data folder
const isDev = !app.isPackaged
const dbPath = isDev
  ? path.join(__dirname, '../../sqlite.db')
  : path.join(app.getPath('userData'), 'database.sqlite')

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })

// Auto-run migrations on startup
export function runMigrations(): void {
  const migrationsPath = isDev
    ? path.join(__dirname, '../../src/drizzle')
    : path.join(process.resourcesPath, 'drizzle')

  migrate(db, { migrationsFolder: migrationsPath })
}
