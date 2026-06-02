<template>
  <div v-if="totalPages > 1" class="pagination">
    <!-- 이전 -->
    <button
      class="pg-btn"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
      aria-label="이전 페이지"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
    </button>

    <!-- 페이지 번호 -->
    <button
      v-for="p in visiblePages"
      :key="p"
      class="pg-btn"
      :class="{ 'pg-btn--active': p === page, 'pg-btn--ellipsis': p === '…' }"
      :disabled="p === '…'"
      @click="p !== '…' && emit('update:page', p as number)"
    >
      {{ p }}
    </button>

    <!-- 다음 -->
    <button
      class="pg-btn"
      :disabled="page >= totalPages"
      @click="emit('update:page', page + 1)"
      aria-label="다음 페이지"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>

    <!-- 총 개수 -->
    <span class="pg-total">총 {{ totalItems.toLocaleString() }}건</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  totalItems: number
}>()

const emit = defineEmits<{ (e: 'update:page', page: number): void }>()

const visiblePages = computed(() => {
  const { page, totalPages } = props
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  if (page > 3) pages.push('…')

  const start = Math.max(2, page - 1)
  const end   = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (page < totalPages - 2) pages.push('…')
  pages.push(totalPages)
  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Pretendard', sans-serif;
}

.pg-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.13s, border-color 0.13s, color 0.13s;
}

.pg-btn:hover:not(:disabled):not(.pg-btn--active) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.pg-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.pg-btn--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
  cursor: default;
}

.pg-btn--ellipsis {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: #94a3b8;
}

.pg-total {
  margin-left: 8px;
  font-size: 12.5px;
  color: #94a3b8;
  white-space: nowrap;
}
</style>
