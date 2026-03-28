import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core'

// CHANGED: createdAt from text to integer (Unix timestamp) for consistency with sales table
// and better Drizzle ORM compatibility
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // admin | cashier
  createdAt: integer('created_at').notNull() // Unix timestamp
})

// Productos
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull(),
  image: blob('image')
})

// Ventas
export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  total: real('total').notNull(),
  createdAt: integer('created_at').notNull(), // timestamp
  userId: integer('user_id').notNull()
})

// Detalle de venta
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: real('price').notNull()
})

export type SelectUser = typeof users.$inferSelect
// CHANGED: Added InsertUser type for insert operations
export type InsertUser = typeof users.$inferInsert
// CHANGED: Added SafeUser type (excludes password) for session storage
export type SafeUser = Omit<SelectUser, 'password'>
