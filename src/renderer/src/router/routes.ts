import Dashboard from '@renderer/views/Dashboard.vue'
import Login from '@renderer/views/Login.vue'
import RegistroAdmin from '@renderer/views/RegistroAdmin.vue'
import { useAuthStore } from '@renderer/stores/auth'
import { createRouter, createWebHashHistory } from 'vue-router'
import Inventario from '@renderer/views/Inventario.vue'
import Empleados from '@renderer/views/Empleados.vue'
import Reportes from '@renderer/views/Reportes.vue'
import PuntoVenta from '@renderer/views/PuntoVenta.vue'
import Ventas from '@renderer/views/Ventas.vue'

export const router = createRouter({
  history: createWebHashHistory(), // <--- Obligatorio para Electron
  routes: [
    { path: '/', component: Login },
    { path: '/register-admin', component: RegistroAdmin },
    { path: '/dashboard', component: Dashboard },
    { path: '/pos', component: PuntoVenta },
    { path: '/sales', component: Ventas },
    { path: '/inventory', component: Inventario },
    { path: '/employees', component: Empleados },
    { path: '/reports', component: Reportes }
  ]
})

router.beforeEach(async (to, _, next) => {
  const auth = useAuthStore()

  // Verificamos si hay sesión en cada cambio de ruta importante
  const isAuthenticated = await auth.checkSession()

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else if (to.path === '/' && isAuthenticated) {
    next('/dashboard') // Si ya está logueado, no dejarlo ir al login
  } else {
    next()
  }
})

export default router
