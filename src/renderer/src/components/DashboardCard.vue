<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string | number
  footerTitle?: string
  footerText?: string
  icon: string
}>()
</script>

<template>
  <div class="bg-white shadow-sm p-5 rounded-2xl">
    <div class="flex justify-between gap-4">
      <div class="flex flex-col gap-2">
        <span class="text-pink-700 font-semibold">{{ title }}</span>
        <div class="text-indigo-700 font-semibold text-2xl! leading-tight!">
          {{ subtitle }}
        </div>
      </div>
      <div
        class="flex items-center justify-center bg-linear-to-b from-pink-400 to-pink-600 rounded-lg w-10 h-10"
      >
        <i :class="icon" class="text-surface-0 dark:text-surface-900 text-xl! leading-none!" />
      </div>
    </div>
    <div class="mt-4">
      <span class="text-surface-600 dark:text-surface-300 font-medium leading-tight">{{
        footerTitle
      }}</span>
      <span class="text-surface-500 dark:text-surface-300 leading-tight">
        {{ footerText ? footerText : '' }}</span
      >
    </div>
  </div>
</template>
