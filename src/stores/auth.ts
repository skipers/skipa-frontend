import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tokenStorage } from '@/http/client'
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
      // 임시 mock — 백엔드 연결 후 아래 주석 해제하고 mock 코드 삭제
      tokenStorage.setAccess('mock-access-token')
      tokenStorage.setRefresh('mock-refresh-token')
      user.value = {
        id: credentials.id,
        name: credentials.id === 'legal' ? 'Legal AI팀' : '반도체 사업부',
        email: credentials.id + '@skipa.com',
        role: credentials.id === 'legal' ? 'LEGAL' : 'BUSINESS',
      }

      // 실제 API 연결 시 아래 코드 사용
      // const data = await authApi.login(credentials)
      // tokenStorage.setAccess(data.accessToken)
      // tokenStorage.setRefresh(data.refreshToken)
      // await fetchMe()

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
