import { ElectronAPI } from '@electron-toolkit/preload'

export interface User {
  id: number
  username: string
  role: string
  createdAt: number
}

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  image?: Uint8Array
}

export interface ProductPayload {
  name: string
  price: number
  stock: number
  image?: Uint8Array
}

export interface Employee {
  id: number
  username: string
  role: string
  createdAt: number
}

export interface EmployeePayload {
  username: string
  password: string
}

export interface SaleItem {
  productId: number
  quantity: number
  price: number
}

export interface SaleResult {
  id: number
  total: number
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppVersion: () => Promise<string>
      checkFirstRun: () => Promise<{ isFirstRun: boolean }>
      registerAdmin: (payload: {
        usuario: string
        contra: string
      }) => Promise<{ success: boolean; error?: string }>
      login: (payload: {
        usuario: string
        contra: string
      }) => Promise<{ success: boolean; error?: string; user?: User }>
      getSession: () => Promise<User | null>
      logout: () => Promise<{ success: boolean }>
      getProducts: () => Promise<{ success: boolean; data?: Product[]; error?: string }>
      createProduct: (
        payload: ProductPayload
      ) => Promise<{ success: boolean; data?: Product; error?: string }>
      updateProduct: (
        payload: ProductPayload & { id: number }
      ) => Promise<{ success: boolean; data?: Product; error?: string }>
      deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>
      seedProducts: () => Promise<{ success: boolean; error?: string }>
      getEmployees: () => Promise<{ success: boolean; data?: Employee[]; error?: string }>
      createEmployee: (
        payload: EmployeePayload
      ) => Promise<{ success: boolean; data?: Employee; error?: string }>
      updateEmployee: (payload: {
        id: number
        username: string
        password?: string
      }) => Promise<{ success: boolean; data?: Employee; error?: string }>
      deleteEmployee: (id: number) => Promise<{ success: boolean; error?: string }>
      createSale: (payload: {
        items: SaleItem[]
      }) => Promise<{ success: boolean; data?: SaleResult; error?: string }>
      getSales: (options?: {
        limit?: number
        offset?: number
        startDate?: number
        endDate?: number
      }) => Promise<{
        success: boolean
        data?: { id: number; total: number; createdAt: number; userId: number; username?: string }[]
        total?: number
        error?: string
      }>
      getSaleItems: (saleId: number) => Promise<{
        success: boolean
        data?: {
          id: number
          saleId: number
          productId: number
          quantity: number
          price: number
          productName: string
        }[]
        error?: string
      }>
      deleteSale: (id: number) => Promise<{ success: boolean; error?: string }>
      getSalesByDate: (
        startDate: number,
        endDate: number
      ) => Promise<{
        success: boolean
        data?: { date: string; total: number }[]
        error?: string
      }>
      getTopProducts: (
        startDate: number,
        endDate: number,
        limit?: number
      ) => Promise<{
        success: boolean
        data?: { productId: number; productName: string; quantity: number; total: number }[]
        error?: string
      }>
      getSalesByHour: (
        startDate: number,
        endDate: number
      ) => Promise<{
        success: boolean
        data?: { hour: string; count: number; total: number }[]
        error?: string
      }>
      getReportSummary: (
        startDate: number,
        endDate: number
      ) => Promise<{
        success: boolean
        data?: {
          totalSales: number
          totalOrders: number
          averageTicket: number
          totalProducts: number
        }
        error?: string
      }>
    }
  }
}
