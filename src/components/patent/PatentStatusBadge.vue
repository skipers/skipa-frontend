<template>
  <span class="badge" :class="`badge--${variant}`">
    <span class="badge__dot" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const MAP: Record<string, { label: string; variant: string }> = {
  REGISTERED:      { label: '등록',      variant: 'green'  },
  ACTIVE:          { label: '등록',      variant: 'green'  },
  EXPIRING_SOON:   { label: '만료 예정', variant: 'amber'  },
  EXPIRING:        { label: '만료 예정', variant: 'amber'  },
  EXPIRED:         { label: '만료',      variant: 'red'    },
  ABANDONED:       { label: '포기',      variant: 'red'    },
  PENDING:         { label: '심사 중',   variant: 'blue'   },
  GENERATING:      { label: 'AI 분석 중', variant: 'indigo' },
  COMPLETED:       { label: '분석 완료', variant: 'green'  },
  FAILED:          { label: '분석 실패', variant: 'red'    },
}

const current = computed(() => MAP[props.status] ?? { label: props.status, variant: 'gray' })
const label   = computed(() => current.value.label)
const variant = computed(() => current.value.variant)
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  font-family: 'Pretendard', sans-serif;
}

.badge__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* green */
.badge--green  { background: var(--color-success-bg); color: var(--color-success-dark); border: 1px solid var(--c-green-100); }
.badge--green  .badge__dot { background: var(--color-success); }

/* amber */
.badge--amber  { background: var(--color-warn-bg); color: var(--color-warn-dark); border: 1px solid var(--c-amber-200); }
.badge--amber  .badge__dot { background: var(--color-warn); }

/* red */
.badge--red    { background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger-border); }
.badge--red    .badge__dot { background: var(--color-danger-light); }

/* blue */
.badge--blue   { background: var(--c-blue-50); color: var(--c-blue-700); border: 1px solid var(--c-blue-100); }
.badge--blue   .badge__dot { background: var(--c-blue-500); }

/* indigo */
.badge--indigo { background: var(--color-primary-bg); color: var(--color-primary-darker); border: 1px solid var(--c-primary-200); }
.badge--indigo .badge__dot { background: var(--color-primary); box-shadow: 0 0 4px rgba(99,102,241,0.6); }

/* gray */
.badge--gray   { background: var(--color-surface-hover); color: var(--c-slate-600); border: 1px solid var(--color-border); }
.badge--gray   .badge__dot { background: var(--color-text-subtle); }
</style>
