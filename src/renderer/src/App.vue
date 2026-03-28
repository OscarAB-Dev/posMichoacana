<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth'
import Header from './components/Header.vue'
import { ProgressSpinner } from 'primevue'

const { user } = storeToRefs(useAuthStore())
</script>

<template>
  <div class="bg-slate-200 flex flex-col items-center justify-center font-sans text-slate-900">
    <div class="min-h-screen w-full">
      <Suspense>
        <Header v-if="user" />
      </Suspense>
      <Suspense>
        <router-view v-slot="{ Component }">
          <transition
            enter-active-class="duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
        <template #fallback>
          <div class="flex items-center justify-center h-full">
            <ProgressSpinner />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>
