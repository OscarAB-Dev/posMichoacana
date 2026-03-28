import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/routes'
import PrimeVue from 'primevue/config'
import nora from '@primeuix/themes/nora'

import { definePreset } from '@primeuix/themes'
import { createPinia } from 'pinia'
import { Ripple, ToastService } from 'primevue'

// CHANGED: Simplified darkModeSelector (false || 'none' always evaluates to 'none')
const MyPreset = definePreset(nora, {
  semantic: {
    primary: {
      50: '{pink.50}',
      100: '{pink.100}',
      200: '{pink.200}',
      300: '{pink.300}',
      400: '{pink.400}',
      500: '{pink.500}',
      600: '{pink.600}',
      700: '{pink.700}',
      800: '{pink.800}',
      900: '{pink.900}',
      950: '{pink.950}'
    }
  }
})
const pinia = createPinia()

createApp(App)
  .use(router)
  .use(pinia)
  .use(ToastService)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: MyPreset,
      options: {
        darkModeSelector: 'none' // Simplified expression
      }
    }
  })
  .directive('ripple', Ripple)
  .mount('#app')
