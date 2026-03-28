# AGENTS.md

This document provides guidelines and instructions for agents working with this codebase.

## Project Overview

- **Name**: posmichoacana
- **Type**: Electron desktop application with Vue 3 + TypeScript frontend
- **Stack**: electron-vite, Vue 3, Pinia, PrimeVue, Tailwind CSS, Drizzle ORM with SQLite

## Directory Structure

```
src/
  main/           # Electron main process (Node.js)
    db/           # Database connection and schema
  preload/        # Context bridge between main and renderer
  renderer/       # Vue frontend application
    src/
      views/      # Page components
      stores/     # Pinia stores
      router/     # Vue Router configuration
      assets/     # CSS and static assets
```

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start development server

# Build
npm run build            # Typecheck + build all platforms
npm run build:win        # Windows build
npm run build:mac        # macOS build
npm run build:linux      # Linux build
npm run build:unpack     # Build without packaging

# Linting
npm run lint             # Run ESLint with cache
npm run format           # Format all files with Prettier

# Type Checking
npm run typecheck        # Check both Node and Web TypeScript
npm run typecheck:node   # Check main/preload (Node config)
npm run typecheck:web    # Check renderer (Vue config)
```

## Code Style Guidelines

### Formatting (Prettier)

- **Single quotes** for strings
- **No semicolons**
- **Print width**: 100 characters
- **No trailing commas**

### EditorConfig

- 2-space indentation
- UTF-8 charset
- LF line endings
- Trim trailing whitespace
- Insert final newline

### TypeScript Conventions

- Use strict TypeScript; avoid `any` when possible
- Vue `<script setup>` uses `<script setup lang="ts">`
- Preload exposes typed API via `contextBridge`
- Use `@renderer/*` path alias for renderer imports

### Vue Components

- Single-file components with `<script setup lang="ts">`
- Use Composition API with `<script setup>` syntax
- Import PrimeVue components directly: `import { Button } from 'primevue'`
- No multi-word component name requirement (disabled in ESLint)
- Wrap async components in `<Suspense>` with fallback

### Database (Drizzle ORM + SQLite)

- Schema defined in `src/main/db/schema.ts`
- Use SQLite with `better-sqlite3`
- Type inference with `$inferSelect` and `$inferInsert`
- Database file: `sqlite.db` in project root (dev), `database.sqlite` in userData (prod)

### IPC Communication

- Main process handlers: `ipcMain.handle('domain:action', async (_, payload) => {...})`
- Preload exposes API via `window.api`
- Use camelCase for API methods: `window.api.login()`, `window.api.registerAdmin()`

### Error Handling

- Always wrap async IPC calls in try-catch blocks
- Return `{ success: boolean, error?: string }` pattern from handlers
- Console.log errors during development, avoid exposing internals to client

## Dependencies

### Core

- `electron` - Desktop framework
- `vue` - UI framework
- `vue-router` - Routing
- `pinia` - State management

### UI

- `primevue` - Component library
- `@primeuix/themes` - PrimeVue themes (nora preset with pink primary)
- `tailwindcss` - Utility CSS
- `primeicons` - Icon set

### Database

- `better-sqlite3` - SQLite driver
- `drizzle-orm` - ORM
- `bcryptjs` - Password hashing

### Build Tools

- `electron-vite` - Build tool
- `vite` - Bundler
- `typescript` - Type checking
- `eslint` - Linting
- `prettier` - Formatting
- `electron-builder` - Packaging

## IDE Setup

Recommended: VSCode with:

- ESLint extension
- Prettier extension
- Volar extension (Vue tooling)
