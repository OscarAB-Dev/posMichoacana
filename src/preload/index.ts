// CHANGED: Added getSession and logout methods to match main process handlers
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkFirstRun: () => ipcRenderer.invoke('auth:check-init'),
  registerAdmin: (data: { usuario: string; password: string }) =>
    ipcRenderer.invoke('auth:register-admin', data),
  login: (data: { usuario: string; password: string }) => ipcRenderer.invoke('auth:login', data),
  getSession: () => ipcRenderer.invoke('auth:get-session'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  createProduct: (data: { name: string; price: number; stock: number; image?: Uint8Array }) =>
    ipcRenderer.invoke('products:create', data),
  updateProduct: (data: {
    id: number
    name: string
    price: number
    stock: number
    image?: Uint8Array
  }) => ipcRenderer.invoke('products:update', data),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  seedProducts: () => ipcRenderer.invoke('products:seed'),
  getEmployees: () => ipcRenderer.invoke('employees:getAll'),
  createEmployee: (data: { username: string; password: string }) =>
    ipcRenderer.invoke('employees:create', data),
  updateEmployee: (data: { id: number; username: string; password?: string }) =>
    ipcRenderer.invoke('employees:update', data),
  deleteEmployee: (id: number) => ipcRenderer.invoke('employees:delete', id),
  createSale: (data: { items: { productId: number; quantity: number; price: number }[] }) =>
    ipcRenderer.invoke('sales:create', data),
  getSales: (options?: { limit?: number; offset?: number; startDate?: number; endDate?: number }) =>
    ipcRenderer.invoke('sales:getAll', options),
  getSaleItems: (saleId: number) => ipcRenderer.invoke('sales:getItems', saleId),
  deleteSale: (id: number) => ipcRenderer.invoke('sales:delete', id),
  getSalesByDate: (startDate: number, endDate: number) =>
    ipcRenderer.invoke('reports:salesByDate', { startDate, endDate }),
  getTopProducts: (startDate: number, endDate: number, limit?: number) =>
    ipcRenderer.invoke('reports:topProducts', { startDate, endDate, limit }),
  getSalesByHour: (startDate: number, endDate: number) =>
    ipcRenderer.invoke('reports:salesByHour', { startDate, endDate }),
  getReportSummary: (startDate: number, endDate: number) =>
    ipcRenderer.invoke('reports:summary', { startDate, endDate })
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
