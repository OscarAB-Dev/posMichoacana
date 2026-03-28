import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export interface User {
  id: number
  username: string
  role: string
  createdAt: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const router = useRouter()

  async function checkSession(): Promise<User | null> {
    const session = await window.api.getSession()
    user.value = session
    return session
  }

  async function logout(): Promise<void> {
    await window.api.logout()
    user.value = null
    router.push('/')
  }

  return { user, checkSession, logout }
})
