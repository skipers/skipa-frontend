<script setup>
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
</script>

<template>
  <header
    class="fixed top-0 right-0 flex items-center justify-between px-6"
    style="left:240px; height:64px; background:#fff; border-bottom:1px solid #E2E8F0; z-index:40;"
  >
    <slot name="title">
      <h1 class="text-lg font-semibold text-gray-800"></h1>
    </slot>
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-700 font-medium">{{ auth.currentUser?.name }}</span>
      <span
        class="text-xs px-2 py-1 rounded-full font-semibold"
        :style="auth.isLegal
          ? 'background:rgba(59,130,246,0.1); color:#3B82F6;'
          : 'background:rgba(255,122,0,0.1); color:#FF7A00;'"
      >
        {{ auth.isLegal ? 'Legal팀' : '사업부' }}
      </span>
    </div>
  </header>
</template>
