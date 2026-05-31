<script setup>
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="min-h-screen" style="background:#F5F6FA;">
    <Sidebar />
    <Header>
      <template #title>
        <div class="flex flex-col gap-0.5">
          <h1 class="text-lg font-semibold text-gray-800">{{ title }}</h1>
          <p v-if="subtitle" class="text-xs text-gray-500">{{ subtitle }}</p>
        </div>
      </template>
    </Header>
    <main style="margin-left:240px; padding-top:64px;">
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
