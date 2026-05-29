<script setup>
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <div class="min-h-screen" style="background:#F5F6FA;">
    <Sidebar />
    <Header>
      <template #title>
        <h1 class="text-lg font-semibold text-gray-800">{{ title }}</h1>
      </template>
    </Header>
    <main style="margin-left:240px; padding-top:64px;">
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
