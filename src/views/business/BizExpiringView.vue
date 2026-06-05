<template>
  <ExpiringView :dept-id="auth.user?.departmentId" />
</template>

<script setup lang="ts">
import ExpiringView from '@/views/legal/ExpiringView.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>
