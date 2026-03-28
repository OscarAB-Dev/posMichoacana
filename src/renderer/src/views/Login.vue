<script setup lang="ts">
import { useAuthStore } from '@renderer/stores/auth'
import { Button, InputText } from 'primevue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()
const usuario = ref('')
const contra = ref('')
const error = ref('')

onMounted(async () => {
  const { isFirstRun } = await window.api.checkFirstRun()
  if (isFirstRun) {
    router.push('/register-admin')
  }
})

async function ingresar(): Promise<void> {
  error.value = ''

  if (!usuario.value || !contra.value) {
    error.value = 'Completa ambos campos'
    return
  }

  try {
    const response = await window.api.login({
      usuario: usuario.value,
      contra: contra.value
    })

    if (!response.success) {
      error.value = response.error || 'Error al ingresar'
      return
    }

    // Sincronizamos el estado de Pinia
    await auth.checkSession()
    // Navegamos al dashboard
    router.push('/dashboard')
  } catch (err) {
    console.error(err)
    error.value = 'Error de comunicación con el backend'
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-4">
    <img
      src="../assets/logoMichoacana.png"
      alt="Logo de paleteria La Michoacana"
      class="w-1/4 h-1/4 object-contain"
    />
    <h2 class="text-black font-semibold text-2xl md:text-3xl max-w-[30ch] text-center">
      Bienvenid@ a La Michoacana
    </h2>
    <form class="flex flex-col gap-2" @submit.prevent="ingresar">
      <InputText v-model="usuario" type="text" size="large" placeholder="Usuario" />
      <InputText v-model="contra" type="password" size="large" placeholder="Contraseña" />

      <Button type="submit" severity="primary" label="Ingresar" />
    </form>
    <p v-if="error" class="text-red-500 font-bold">{{ error }}</p>
  </div>
</template>
