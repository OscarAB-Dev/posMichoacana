<script setup lang="ts">
import { ref } from 'vue'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@renderer/stores/auth'
import NavButton from './NavButton.vue'

const router = useRouter()
const route = useRoute()
const drawerVisible = ref(false)
const { user } = useAuthStore()
const version = await window.api.getAppVersion()

const logOut = async (): Promise<void> => {
  await window.api.logout()
  router.push('/')
}

const adminMenuItems = ref([
  {
    label: 'Menú',
    items: [
      { label: 'Inicio', icon: 'pi pi-home', route: '/dashboard' },
      { label: 'Punto de Venta', icon: 'pi pi-shopping-cart', route: '/pos' },
      { label: 'Ventas', icon: 'pi pi-money-bill', route: '/sales' },
      { label: 'Inventario', icon: 'pi pi-box', route: '/inventory' },
      { label: 'Empleados', icon: 'pi pi-users', route: '/employees' },
      { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/reports' }
    ]
  }
])
const employeeMenuItems = ref([
  {
    label: 'Menú',
    items: [
      { label: 'Inicio', icon: 'pi pi-home', route: '/dashboard' },
      { label: 'Punto de Venta', icon: 'pi pi-shopping-cart', route: '/pos' },
      { label: 'Ventas', icon: 'pi pi-money-bill', route: '/sales' },
      { label: 'Inventario', icon: 'pi pi-box', route: '/inventory' }
    ]
  }
])

const displayItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems

// const userMenuRef = ref()
// const userMenuItems = ref([
//   {
//     label: 'Mi Cuenta',
//     items: [
//       { label: 'Perfil', icon: 'pi pi-user', command: () => {} },
//       { separator: true },
//       { label: 'Cerrar Sesión', icon: 'pi pi-sign-out', command: () => {} }
//     ]
//   }
// ])

// const toggleUserMenu = (event: Event): void => {
//   userMenuRef.value?.toggle(event)
// }

const navigateTo = (itemRoute: string): void => {
  router.push(itemRoute)
  drawerVisible.value = false
}

const isActiveRoute = (itemRoute: string): boolean => {
  return route.path === itemRoute
}

const goBack = (): void => {
  router.back()
}
</script>

<template>
  <header
    class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40"
  >
    <div class="flex items-center gap-3">
      <Button
        v-ripple
        icon="pi pi-bars"
        severity="secondary"
        text
        rounded
        aria-label="Abrir menú"
        @click="drawerVisible = true"
      />
      <div class="flex items-center gap-2">
        <Button text rounded @click="goBack">
          <i class="pi pi-arrow-left text-pink-500"></i>
        </Button>
        <div
          class="w-8 h-8 bg-linear-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-shopping-bag text-white" />
        </div>
        <span class="font-semibold text-lg text-slate-800">La Michoacana</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <!-- <Button
        v-ripple
        icon="pi pi-bell"
        severity="secondary"
        text
        rounded
        aria-label="Notificaciones"
        class="relative"
      />
      <Button
        v-ripple
        icon="pi pi-user"
        severity="secondary"
        text
        rounded
        aria-label="Cuenta de usuario"
        @click="toggleUserMenu"
      />
      <Menu ref="userMenuRef" :model="userMenuItems" popup /> -->
    </div>
  </header>

  <Drawer
    v-model:visible="drawerVisible"
    position="left"
    class="w-72! bg-white!"
    :show-close-icon="false"
    :modal="true"
    :dismissable="true"
  >
    <template #header>
      <div class="flex items-center gap-3 px-2 py-1">
        <div
          class="w-10 h-10 bg-linear-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center"
        >
          <i class="pi pi-user text-white" />
        </div>
        <div>
          <p class="font-semibold text-slate-800 m-0 uppercase">{{ user?.username }}</p>
          <p class="text-sm text-slate-500 m-0">
            {{ user?.role === 'admin' ? 'Administrador' : 'Emplead@' }}
          </p>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div v-for="section in displayItems" :key="section.label">
        <p class="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">
          {{ section.label }}
        </p>
        <nav class="flex flex-col gap-1">
          <NavButton
            v-for="item in section.items"
            :key="item.label"
            :label="item.label"
            :icon="item.icon"
            :route="item.route"
            :is-active="isActiveRoute(item.route)"
            @navigate="navigateTo"
          />
        </nav>
      </div>
    </div>

    <template #footer>
      <div
        class="px-2 pt-4 border-t border-slate-200 flex flex-col justify-center items-center gap-2"
      >
        <Button
          v-ripple
          fluid
          icon="pi pi-sign-out"
          severity="danger"
          label="Cerrar Sesión"
          @click="logOut"
        />
        <div class="flex items-center gap-3 text-slate-500 text-sm">
          <i class="pi pi-info-circle" />
          <span>Pos Michoacana v{{ version }}</span>
        </div>
      </div>
    </template>
  </Drawer>
</template>
