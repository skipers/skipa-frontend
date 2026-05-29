<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const legalMenus = [
  { label: '홈', path: '/legal/home' },
  { label: '전체 특허 목록', path: '/patents' },
  { label: '재평가 관리', path: '/legal/evaluation' },
  { label: '포트폴리오 분석', path: '/legal/portfolio' },
  { label: '만료 예정 관리', path: '/legal/expiring' },
]

const deptMenus = [
  { label: '홈', path: '/dept/home' },
  { label: '검토 현황', path: '/dept/review' },
  { label: '담당 특허 관리', path: '/dept/patents' },
  { label: '사전 평가 Lab', path: '/dept/lab' },
]

const menus = computed(() => (auth.isLegal ? legalMenus : deptMenus))

function isActive(path) {
  if (path === '/patents') return route.path === '/patents' || route.path.startsWith('/patents/')
  return route.path === path
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="fixed top-0 left-0 h-full w-60 flex flex-col" style="background:#1A1A2E; z-index:50;">
    <div class="px-6 py-5 border-b border-white/10">
      <div class="text-xl font-bold leading-tight">
        <span style="color:#FF7A00;">SK</span><span class="text-white">IPA</span>
      </div>
      <div class="text-xs mt-0.5" style="color:rgba(255,255,255,0.5);">SK IP Agent</div>
    </div>

    <nav class="flex-1 py-4 overflow-y-auto">
      <ul class="space-y-0.5 px-3">
        <li v-for="menu in menus" :key="menu.path">
          <router-link
            :to="menu.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative"
            :style="isActive(menu.path)
              ? 'color:#FF7A00; font-weight:600;'
              : 'color:rgba(255,255,255,0.6);'"
          >
            <span
              v-if="isActive(menu.path)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
              style="background:#FF7A00;"
            />
            {{ menu.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="px-5 py-4 border-t border-white/10">
      <div class="mb-3">
        <div class="font-semibold text-white text-sm">{{ auth.currentUser?.name }}</div>
        <div class="text-xs mt-0.5" style="color:rgba(255,255,255,0.5);">
          {{ auth.isLegal ? 'Legal팀' : auth.currentUser?.dept }}
        </div>
      </div>
      <button
        @click="logout"
        class="text-xs px-3 py-1.5 rounded cursor-pointer"
        style="color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.05); border:none;"
      >
        로그아웃
      </button>
    </div>
  </aside>
</template>
