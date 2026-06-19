import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tokenStorage } from '@/api/axios'
import { authApi } from '@/api/auth'
import type { User, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────
  const user = ref<User | null>(null)
  const loading = ref(false)

  // ── Getters ────────────────────────────────────────────
  const isAuthenticated = computed(() => !!tokenStorage.getAccess() && !!user.value)
  const isLegal = computed(() => user.value?.role === 'LEGAL')
  const isBusiness = computed(() => user.value?.role === 'BUSINESS')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // ── Actions ────────────────────────────────────────────

  async function login(credentials: LoginRequest) {
    loading.value = true
    try {
      const data = await authApi.login(credentials.id, credentials.password)
      tokenStorage.setAccess(data.accessToken)
      await fetchMe()
      return user.value
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    const data = await authApi.me()
    user.value = data.user
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 토큰 만료 등 무시
    } finally {
      user.value = null
      tokenStorage.clear()
    }
  }

  // 앱 시작 시 토큰 있으면 user 복원
  async function init() {
    if (tokenStorage.getAccess() && !user.value) {
      try {
        await fetchMe()
      } catch {
        tokenStorage.clear()
      }
    }
  }

  return { user, loading, isAuthenticated, isLegal, isBusiness, isAdmin, login, logout, init }
})
