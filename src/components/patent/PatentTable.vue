<template>
  <div class="patent-table-wrap">
    <!-- 로딩 스켈레톤 -->
    <template v-if="loading">
      <div class="skeleton-row" v-for="n in skeletonCount" :key="n">
        <div class="skeleton-cell skeleton-cell--wide" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell skeleton-cell--short" />
        <div class="skeleton-cell skeleton-cell--short" />
        <div class="skeleton-cell skeleton-cell--badge" />
      </div>
    </template>

    <!-- 빈 상태 -->
    <template v-else-if="!items.length">
      <div class="empty-state">
        <div class="empty-state__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
          </svg>
        </div>
        <p class="empty-state__title">특허가 없습니다</p>
        <p class="empty-state__desc">검색 조건을 변경하거나 새 특허를 등록해보세요.</p>
      </div>
    </template>

    <!-- 테이블 -->
    <template v-else>
      <table class="patent-table">
        <thead>
          <tr>
            <th class="col-title">특허명</th>
            <th class="col-number">출원번호</th>
            <th
              class="col-date sortable"
              :class="{ 'sort-active': sortKey === 'applicationDate' }"
              @click="toggleSort('applicationDate')"
            >
              출원일
              <SortIcon :active="sortKey === 'applicationDate'" :dir="sortDir" />
            </th>
            <th
              class="col-date sortable"
              :class="{ 'sort-active': sortKey === 'expiryDate' }"
              @click="toggleSort('expiryDate')"
            >
            소멸일
              <SortIcon :active="sortKey === 'expiryDate'" :dir="sortDir" />
            </th>
            <th class="col-field">기술 분야</th>
            <th
              class="col-citation sortable"
              :class="{ 'sort-active': sortKey === 'citationCount' }"
              @click="toggleSort('citationCount')"
            >
              피인용
              <SortIcon :active="sortKey === 'citationCount'" :dir="sortDir" />
            </th>
            <th class="col-status">상태</th>
            <th class="col-action" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="patent in items"
            :key="patent.id"
            class="patent-row"
            @click="emit('select', patent)"
            tabindex="0"
            @keydown.enter="emit('select', patent)"
          >
            <!-- 특허명 -->
            <td class="col-title">
              <div class="patent-title-cell">
                <span class="patent-title">{{ patent.title }}</span>
                <span v-if="patent.summary" class="patent-summary">{{ patent.summary }}</span>
              </div>
            </td>

            <!-- 출원번호 -->
            <td class="col-number">
              <span class="mono">{{ patent.applicationNumber }}</span>
            </td>

            <!-- 출원일 -->
            <td class="col-date">
              {{ formatDate(patent.applicationDate) }}
            </td>

            <!-- 소멸일 -->
            <td class="col-date">
              <span :class="isExpired(patent.expiryDate) ? 'expiry--expired' : ''">
                {{ formatDate(patent.expiryDate) }}
              </span>
            </td>

            <!-- 기술 분야 -->
            <td class="col-field">
              <span v-if="patent.techField" class="field-tag">{{ patent.techField }}</span>
              <span v-else class="text-muted">—</span>
            </td>

            <!-- 피인용 -->
            <td class="col-citation">
              <span v-if="patent.citationCount != null" class="citation-count">{{ patent.citationCount }}</span>
              <span v-else class="text-muted">—</span>
            </td>

            <!-- 상태 -->
            <td class="col-status">
              <PatentStatusBadge :status="patent.status ?? 'REGISTERED'" />
            </td>

            <!-- 상세 이동 -->
            <td class="col-action">
              <span class="row-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h } from 'vue'
import PatentStatusBadge from './PatentStatusBadge.vue'

// 인라인 정렬 아이콘 컴포넌트
const SortIcon = defineComponent({
  props: { active: Boolean, dir: String },
  setup(props) {
    return () => h('span', { class: 'sort-icon' }, [
      h('svg', { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5',
        style: { opacity: props.active ? 1 : 0.3, transform: props.dir === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }
      }, [
        h('path', { d: 'M12 5l7 7H5z' })
      ])
    ])
  }
})

export interface PatentRow {
  id: number
  title: string
  applicationNumber: string
  registrationNumber?: string
  applicationDate?: string
  expiryDate?: string
  status?: string
  techField?: string
  businessField?: string
  summary?: string
  citationCount?: number
}

const props = withDefaults(defineProps<{
  items: PatentRow[]
  loading?: boolean
  skeletonCount?: number
}>(), {
  loading: false,
  skeletonCount: 8,
})

const emit = defineEmits<{
  (e: 'select', patent: PatentRow): void
  (e: 'sort', key: string, dir: 'asc' | 'desc'): void
}>()

const sortKey = ref<string>('')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
  emit('sort', sortKey.value, sortDir.value)
}

function formatDate(d?: string) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function isExpired(d?: string) {
  return !!d && new Date(d).getTime() < Date.now()
}

</script>

<style scoped>
.patent-table-wrap {
  font-family: 'Pretendard', sans-serif;
  width: 100%;
}

/* ── 테이블 ──────────────────────────────────────────── */
.patent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  color: var(--color-text);
}

.patent-table thead tr {
  border-bottom: 1.5px solid var(--color-border);
}

.patent-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  user-select: none;
}

.patent-table th.sortable {
  cursor: pointer;
  display: table-cell;
}

.patent-table th.sortable:hover,
.patent-table th.sort-active {
  color: var(--color-text);
}

.sort-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
}

/* ── 행 ─────────────────────────────────────────────── */
.patent-row {
  border-bottom: 1px solid var(--color-surface-muted);
  cursor: pointer;
  transition: background 0.12s;
}

.patent-row:hover {
  background: var(--color-surface-hover);
}

.patent-row:hover .row-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.patent-table td {
  padding: 14px 14px;
  vertical-align: middle;
}

/* ── 셀 너비 ─────────────────────────────────────────── */
.col-title    { min-width: 260px; }
.col-number   { width: 160px; }
.col-date     { width: 100px; white-space: nowrap; }
.col-status   { width: 110px; }
.col-field    { width: 110px; }
.col-citation { width: 70px; text-align: center; }
.col-action   { width: 40px; text-align: right; }

/* ── 특허명 셀 ───────────────────────────────────────── */
.patent-title-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.patent-title {
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.patent-summary {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 기타 셀 스타일 ──────────────────────────────────── */
.mono {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12.5px;
  color: var(--c-slate-600);
}


.field-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-surface-muted);
  border-radius: 5px;
  font-size: 12px;
  color: var(--c-slate-600);
  font-weight: 500;
}

.text-muted { color: var(--c-slate-300); }

.citation-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.expiry--expired { color: var(--color-danger); font-weight: 600; }

.row-arrow {
  display: flex;
  justify-content: flex-end;
  color: var(--c-slate-300);
  opacity: 0;
  transition: opacity 0.12s, transform 0.12s;
}

/* ── 스켈레톤 ────────────────────────────────────────── */
.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 14px;
  border-bottom: 1px solid var(--color-surface-muted);
}

.skeleton-cell {
  height: 14px;
  background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--c-slate-150) 50%, var(--color-surface-muted) 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
  width: 80px;
}

.skeleton-cell--wide  { width: 240px; }
.skeleton-cell--short { width: 90px; }
.skeleton-cell--badge { width: 72px; height: 22px; border-radius: 20px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── 빈 상태 ─────────────────────────────────────────── */
.empty-state {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.empty-state__icon {
  width: 56px; height: 56px;
  background: var(--color-surface-muted);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-subtle);
  margin-bottom: 4px;
}

.empty-state__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
}

.empty-state__desc {
  font-size: 13.5px;
  color: var(--color-text-subtle);
  margin: 0;
}
</style>
