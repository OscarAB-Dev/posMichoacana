import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// CHANGED: Import SafeUser type for proper typing of currentUser
import { SafeUser, users, products, sales, saleItems } from './db/schema'
import { eq, sql, and, gte, lte, count, desc } from 'drizzle-orm'
import { db } from './db'
import bcrypt from 'bcryptjs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

//Verificar que la primera vez no haya usuarios para registrar al administrador
ipcMain.handle('auth:check-init', async () => {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users)
  const userCount = result[0]?.count ?? 0
  return { isFirstRun: userCount === 0 }
})

//Registrar al administrador
ipcMain.handle('auth:register-admin', async (_, payload: { usuario: string; contra: string }) => {
  if (!payload || !payload.usuario || !payload.contra) {
    return { success: false, error: 'Faltaron credenciales por llenar' }
  }

  try {
    const hashed = await bcrypt.hash(payload.contra, 10)

    // CHANGED: Added createdAt since schema now requires it (was previously optional text)
    const result = await db.insert(users).values({
      username: payload.usuario,
      password: hashed,
      role: 'admin',
      createdAt: Math.floor(Date.now() / 1000) // Unix timestamp
    })

    return { success: !!result }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error de base de datos' }
  }
})

// CHANGED: Using SafeUser type instead of local SessionUser (already defined in schema.ts)
let currentUser: SafeUser | null = null
//Login de Usuario
ipcMain.handle('auth:login', async (_, payload) => {
  try {
    const user = await db.select().from(users).where(eq(users.username, payload.usuario)).get()

    if (user && (await bcrypt.compare(payload.contra, user.password))) {
      // FIXED: Create safeUser without password using type-safe approach
      const safeUser: SafeUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
      currentUser = safeUser
      return { success: true, user: safeUser }
    }
    return { success: false, error: 'Credenciales inválidas' }
    // FIXED: Log error for debugging instead of ignoring it
  } catch (err) {
    console.error('Login error:', err)
    return { success: false, error: 'Error de BD' }
  }
})

// Middleware: Obtener sesión actual
ipcMain.handle('auth:get-session', () => {
  return currentUser
})

// Logout
ipcMain.handle('auth:logout', () => {
  currentUser = null
  return { success: true }
})

// Product handlers
ipcMain.handle('products:getAll', async () => {
  try {
    const result = await db.select().from(products).all()
    return { success: true, data: result }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al obtener productos' }
  }
})

ipcMain.handle(
  'products:create',
  async (_, payload: { name: string; price: number; stock: number; image?: Uint8Array }) => {
    try {
      const result = await db.insert(products).values(payload).returning()
      return { success: true, data: result[0] }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al crear producto' }
    }
  }
)

ipcMain.handle(
  'products:update',
  async (
    _,
    payload: { id: number; name: string; price: number; stock: number; image?: Uint8Array }
  ) => {
    try {
      const result = await db
        .update(products)
        .set(payload)
        .where(eq(products.id, payload.id))
        .returning()
      return { success: true, data: result[0] }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al actualizar producto' }
    }
  }
)

ipcMain.handle('products:delete', async (_, id: number) => {
  try {
    await db.delete(products).where(eq(products.id, id))
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al eliminar producto' }
  }
})

ipcMain.handle('products:seed', async () => {
  try {
    const mockProducts = [
      { name: 'Cerveza Corona 6 Pack', price: 120.0, stock: 50 },
      { name: 'Cerveza Modelo 6 Pack', price: 130.0, stock: 45 },
      { name: 'Tequila Jose Cuervo', price: 280.0, stock: 20 },
      { name: 'Whisky Jack Daniels', price: 450.0, stock: 15 },
      { name: 'Vodka Smirnoff', price: 180.0, stock: 30 },
      { name: 'Ron Havana Club', price: 220.0, stock: 25 },
      { name: 'Gaseosa Coca Cola 2L', price: 28.0, stock: 100 },
      { name: 'Agua Bonafont 1L', price: 15.0, stock: 80 },
      { name: 'Chips Sabritas', price: 35.0, stock: 60 },
      { name: 'Cigarrillos Marlboro', price: 85.0, stock: 40 }
    ]
    await db.insert(products).values(mockProducts)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al sembrar productos' }
  }
})

ipcMain.handle('employees:getAll', async () => {
  try {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .all()
    return { success: true, data: result }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al obtener empleados' }
  }
})

ipcMain.handle('employees:create', async (_, payload: { username: string; password: string }) => {
  if (!payload || !payload.username || !payload.password) {
    return { success: false, error: 'Faltan campos requeridos' }
  }

  try {
    const hashed = await bcrypt.hash(payload.password, 10)
    const result = await db
      .insert(users)
      .values({
        username: payload.username,
        password: hashed,
        role: 'cashier',
        createdAt: Math.floor(Date.now() / 1000)
      })
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt
      })
    return { success: true, data: result[0] }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al crear empleado' }
  }
})

ipcMain.handle(
  'employees:update',
  async (_, payload: { id: number; username: string; password?: string }) => {
    if (!payload || !payload.id || !payload.username) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    try {
      const updateData: { username: string; password?: string } = { username: payload.username }
      if (payload.password) {
        updateData.password = await bcrypt.hash(payload.password, 10)
      }
      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, payload.id))
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt
        })
      return { success: true, data: result[0] }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al actualizar empleado' }
    }
  }
)

ipcMain.handle('employees:delete', async (_, id: number) => {
  try {
    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al eliminar empleado' }
  }
})

ipcMain.handle(
  'sales:create',
  async (_, payload: { items: { productId: number; quantity: number; price: number }[] }) => {
    if (!payload || !payload.items || payload.items.length === 0) {
      return { success: false, error: 'No hay productos en la venta' }
    }

    if (!currentUser) {
      return { success: false, error: 'No hay sesion activa' }
    }

    try {
      const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const saleResult = await db
        .insert(sales)
        .values({
          total,
          createdAt: Math.floor(new Date().getTime() / 1000),
          userId: currentUser.id
        })
        .returning()

      const saleId = saleResult[0].id

      const saleItemsData = payload.items.map((item) => ({
        saleId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))

      await db.insert(saleItems).values(saleItemsData)

      for (const item of payload.items) {
        const product = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .get()
        if (product) {
          await db
            .update(products)
            .set({ stock: product.stock - item.quantity })
            .where(eq(products.id, item.productId))
        }
      }

      return { success: true, data: { id: saleId, total } }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al registrar la venta' }
    }
  }
)

ipcMain.handle('sales:getAll', async (_, { limit = 10, offset = 0, startDate, endDate } = {}) => {
  try {
    let result
    let total: number

    if (startDate !== undefined && endDate !== undefined) {
      result = await db
        .select({
          id: sales.id,
          total: sales.total,
          createdAt: sales.createdAt,
          userId: sales.userId,
          username: users.username
        })
        .from(sales)
        .innerJoin(users, eq(sales.userId, users.id))
        .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
        .orderBy(desc(sales.createdAt))
        .limit(limit)
        .offset(offset)
        .all()

      const totalResult = await db
        .select({ count: count() })
        .from(sales)
        .innerJoin(users, eq(sales.userId, users.id))
        .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
      total = totalResult[0]?.count || 0
    } else {
      result = await db
        .select({
          id: sales.id,
          total: sales.total,
          createdAt: sales.createdAt,
          userId: sales.userId,
          username: users.username
        })
        .from(sales)
        .innerJoin(users, eq(sales.userId, users.id))
        .orderBy(desc(sales.createdAt))
        .limit(limit)
        .offset(offset)
        .all()
      const totalResult = await db.select({ count: count() }).from(sales)
      total = totalResult[0]?.count || 0
    }

    return { success: true, data: result, total }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al obtener ventas' }
  }
})

ipcMain.handle('sales:getItems', async (_, saleId: number) => {
  try {
    const result = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        price: saleItems.price,
        productName: products.name
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId))
      .all()
    return { success: true, data: result }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al obtener detalles de venta' }
  }
})

ipcMain.handle('sales:delete', async (_, id: number) => {
  try {
    await db.delete(saleItems).where(eq(saleItems.saleId, id))
    await db.delete(sales).where(eq(sales.id, id))
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Error al eliminar venta' }
  }
})

// Reportes
ipcMain.handle(
  'reports:salesByDate',
  async (_, { startDate, endDate }: { startDate: number; endDate: number }) => {
    try {
      const result = await db
        .select({
          date: sql`strftime('%Y-%m-%d', ${sales.createdAt}, 'unixepoch', 'localtime')`.as('date'),
          total: sql`sum(${sales.total})`.as('total')
        })
        .from(sales)
        .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
        .groupBy(sql`strftime('%Y-%m-%d', ${sales.createdAt}, 'unixepoch', 'localtime')`)
        .orderBy(sql`strftime('%Y-%m-%d', ${sales.createdAt}, 'unixepoch', 'localtime')`)
        .all()
      return { success: true, data: result }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al obtener ventas por fecha' }
    }
  }
)

ipcMain.handle(
  'reports:topProducts',
  async (
    _,
    { startDate, endDate, limit = 10 }: { startDate: number; endDate: number; limit?: number }
  ) => {
    try {
      const result = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          quantity: sql`sum(${saleItems.quantity})`.as('quantity'),
          total: sql`sum(${saleItems.quantity} * ${saleItems.price})`.as('total')
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
        .groupBy(saleItems.productId)
        .orderBy(sql`sum(${saleItems.quantity} * ${saleItems.price}) desc`)
        .limit(limit)
        .all()
      return { success: true, data: result }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al obtener productos más vendidos' }
    }
  }
)

ipcMain.handle(
  'reports:salesByHour',
  async (_, { startDate, endDate }: { startDate: number; endDate: number }) => {
    try {
      const result = await db
        .select({
          hour: sql`strftime('%H', ${sales.createdAt}, 'unixepoch', 'localtime')`.as('hour'),
          count: sql`count(*)`.as('count'),
          total: sql`sum(${sales.total})`.as('total')
        })
        .from(sales)
        .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
        .groupBy(sql`strftime('%H', ${sales.createdAt}, 'unixepoch', 'localtime')`)
        .orderBy(sql`strftime('%H', ${sales.createdAt}, 'unixepoch', 'localtime')`)
        .all()
      return { success: true, data: result }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al obtener ventas por hora' }
    }
  }
)

ipcMain.handle(
  'reports:summary',
  async (_, { startDate, endDate }: { startDate: number; endDate: number }) => {
    try {
      const [salesResult, itemsResult] = await Promise.all([
        db
          .select({
            totalSales: sql`sum(${sales.total})`.as('totalSales'),
            count: sql`count(*)`.as('count')
          })
          .from(sales)
          .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
          .all(),
        db
          .select({
            totalProducts: sql`sum(${saleItems.quantity})`.as('totalProducts')
          })
          .from(sales)
          .innerJoin(saleItems, eq(sales.id, saleItems.saleId))
          .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
          .all()
      ])

      const summary = salesResult[0] as { totalSales: number; count: number } | undefined
      const items = itemsResult[0] as { totalProducts: number } | undefined

      return {
        success: true,
        data: {
          totalSales: summary?.totalSales || 0,
          totalOrders: summary?.count || 0,
          averageTicket: summary?.count ? (summary.totalSales as number) / summary.count : 0,
          totalProducts: items?.totalProducts || 0
        }
      }
    } catch (err) {
      console.error(err)
      return { success: false, error: 'Error al obtener resumen' }
    }
  }
)
