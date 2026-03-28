<script setup lang="ts">
import { Button, InputText } from 'primevue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const usuario = ref('')
const contra = ref('')
const error = ref('')
const router = useRouter()

// FIXED: Added explicit return type
async function registrar(): Promise<void> {
  error.value = ''

  if (!usuario.value || !contra.value) {
    error.value = 'Completa ambos campos'
    return
  }

  try {
    const response = await window.api.registerAdmin({
      usuario: usuario.value,
      contra: contra.value
    })

    // CHANGED: Fixed typo from 'sucess' to 'success'
    if (!response.success) {
      error.value = response.error || 'Error al crear administrador'
      return
    }

    router.push('/')
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
      Registre los datos para el administrador del sistema
    </h2>
    <form class="flex flex-col gap-2" @submit.prevent="registrar">
      <InputText v-model="usuario" type="text" size="large" placeholder="Usuario" />
      <InputText v-model="contra" type="password" size="large" placeholder="Contraseña" />

      <Button type="submit" severity="primary" label="Crear Administrador" />
    </form>
    <p class="text-red-500 font-bold">{{ error }}</p>
  </div>
</template>
