<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: 'max-w-lg' },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 flex items-center justify-center" style="z-index:200;">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
      <div
        class="relative w-full mx-4 bg-white rounded-2xl overflow-hidden"
        :class="width"
        style="box-shadow:0 20px 60px rgba(0,0,0,0.15);"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">{{ title }}</h3>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer" style="background:none;border:none;">×</button>
        </div>
        <div class="px-6 py-5">
          <slot />
        </div>
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
