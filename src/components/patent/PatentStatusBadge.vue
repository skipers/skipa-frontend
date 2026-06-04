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
.badge--green  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.badge--green  .badge__dot { background: #22c55e; }

/* amber */
.badge--amber  { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.badge--amber  .badge__dot { background: #f59e0b; }

/* red */
.badge--red    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.badge--red    .badge__dot { background: #ef4444; }

/* blue */
.badge--blue   { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.badge--blue   .badge__dot { background: #3b82f6; }

/* indigo */
.badge--indigo { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
.badge--indigo .badge__dot { background: #6366f1; box-shadow: 0 0 4px rgba(99,102,241,0.6); }

/* gray */
.badge--gray   { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.badge--gray   .badge__dot { background: #94a3b8; }
</style>
