<script setup>
defineProps({
  title: { type: String, default: '' },
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm" :class="padding" style="border:1px solid #E2E8F0;">
    <div v-if="title" class="text-base font-semibold text-gray-800 mb-4">{{ title }}</div>
    <slot />
  </div>
</template>
