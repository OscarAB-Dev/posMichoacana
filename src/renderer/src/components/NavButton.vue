<script setup lang="ts">
defineProps({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  route: { type: String, required: true },
  isActive: { type: Boolean, default: false }
})

defineEmits(['navigate'])
</script>

<template>
  <button
    v-ripple
    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors duration-200 text-left cursor-pointer"
    :class="{ 'bg-pink-50 text-pink-600 hover:bg-pink-100': isActive }"
    @click="$emit('navigate', route)"
  >
    <!-- Icono Principal -->
    <i :class="[icon, 'text-lg']" />

    <!-- Etiqueta -->
    <span class="font-medium">{{ label }}</span>

    <!-- Indicador de Activo (Check) -->
    <i v-if="isActive" class="pi pi-check ml-auto text-pink-500" />
  </button>
</template>
