import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { USERS } from '@/data/patents.js'

const STORAGE_KEY = 'skipa_user_role'

export const useAuthStore = defineStore('auth', () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  const currentUser = ref(saved ? (saved === 'legal' ? USERS.legal : USERS.dept) : null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const isLegal = computed(() => currentUser.value?.role === 'legal')
  const isDept = computed(() => currentUser.value?.role === 'dept')

  watch(currentUser, (user) => {
    if (user) localStorage.setItem(STORAGE_KEY, user.role)
    else localStorage.removeItem(STORAGE_KEY)
  })

  function login(role) {
    currentUser.value = role === 'legal' ? USERS.legal : USERS.dept
  }

  function logout() {
    currentUser.value = null
  }

  return { currentUser, isLoggedIn, isLegal, isDept, login, logout }
})
