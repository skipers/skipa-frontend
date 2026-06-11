<template>
  <div class="history-page">

    <div class="page-header">
      <button class="btn-back" @click="router.push('/biz/review')" type="button">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        제출 현황으로 돌아가기
      </button>
      <h2 class="page-header__title">제출 이력</h2>
      <p class="page-header__desc">제출한 유지/포기 의견 이력을 확인하세요</p>
    </div>

    <!-- 필터 바 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">년도</span>
        <select v-model="filterYear" class="filter-select">
          <option value="">전체</option>
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
        </select>
      </div>
      <div class="filter-group">
        <span class="filter-label">분기</span>
        <select v-model="filterQ" class="filter-select filter-select--narrow">
          <option value="">전체</option>
          <option value="1">1분기</option>
          <option value="2">2분기</option>
          <option value="3">3분기</option>
          <option value="4">4분기</option>
        </select>
      </div>
      <div class="filter-divider" />
      <div class="filter-group">
        <span class="filter-label">의견</span>
        <div class="chip-row">
          <button class="chip" :class="{ 'chip--active': filterDecision === '' }"      @click="filterDecision = ''">전체</button>
          <button class="chip chip--keep"    :class="{ 'chip--active': filterDecision === 'KEEP' }"    @click="filterDecision = 'KEEP'">유지</button>
          <button class="chip chip--dispose" :class="{ 'chip--active': filterDecision === 'DISPOSE' }" @click="filterDecision = 'DISPOSE'">포기</button>
        </div>
      </div>
      <span class="filter-result">{{ filteredHistory.length }}건</span>
    </div>

    <!-- 목록 -->
    <div class="table-card">
      <div v-if="loading" class="skel-rows">
        <div class="skel-row" v-for="n in 5" :key="n" />
      </div>
      <div v-else-if="!filteredHistory.length" class="empty-state">
        <div class="empty-state__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <p>해당하는 이력이 없습니다.</p>
      </div>
      <template v-else>
        <!-- 분기별 그룹 -->
        <div v-for="group in groupedHistory" :key="group.quarter">
          <div class="group-header">
            <span class="group-header__quarter">{{ group.quarter }}</span>
            <span class="group-header__count">{{ group.items.length }}건</span>
          </div>
          <div
            v-for="h in group.items"
            :key="h.id"
            class="history-item"
            @click="router.push(`/biz/patents/${h.patentId}`)"
          >
            <div class="history-item__icon" :class="`decision-icon--${h.decision.toLowerCase()}`">
              <svg v-if="h.decision === 'KEEP'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <svg v-else-if="h.decision === 'DISPOSE'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
            </div>
            <div class="history-item__info">
              <p class="history-item__title">{{ h.patentTitle }}</p>
              <span class="mono history-item__appno">{{ h.applicationNumber }}</span>
            </div>
            <span class="decision-badge" :class="`decision-badge--${h.decision.toLowerCase()}`">
              {{ decisionLabel(h.decision) }}
            </span>
            <p class="history-item__date">{{ formatDate(h.decidedAt) }}</p>
            <svg class="row-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MOCK_PATENTS, MOCK_REEVAL } from '@/mocks/data'

const router  = useRouter()
const loading = ref(false)

interface SubmissionItem {
  id: number; patentId: number; patentTitle: string
  applicationNumber: string; decision: string; decidedAt: string
  quarter: string
}

const allHistory = ref<SubmissionItem[]>([])

function toQuarterLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}년 ${Math.ceil((d.getMonth() + 1) / 3)}분기`
}

function fetchHistory() {
  const done = MOCK_REEVAL.filter(r => r.deptId === 2 && r.decision !== null && r.decidedAt)
  allHistory.value = done
    .map(r => {
      const patent = MOCK_PATENTS.find(p => p.id === r.patentId)!
      return {
        id: r.patentId,
        patentId: r.patentId,
        patentTitle: patent.title,
        applicationNumber: patent.applicationNumber,
        decision: r.decision!,
        decidedAt: r.decidedAt!,
        quarter: toQuarterLabel(r.decidedAt!),
      }
    })
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
}

// ── 필터 상태 ──────────────────────────────────────────
const filterYear     = ref('')
const filterQ        = ref('')
const filterDecision = ref('')

const yearOptions = computed(() => {
  const set = new Set(allHistory.value.map(h => new Date(h.decidedAt).getFullYear()))
  return [...set].sort((a, b) => b - a)
})

const filteredHistory = computed(() => {
  return allHistory.value.filter(h => {
    const d = new Date(h.decidedAt)
    if (filterYear.value && d.getFullYear() !== Number(filterYear.value)) return false
    if (filterQ.value    && Math.ceil((d.getMonth() + 1) / 3) !== Number(filterQ.value)) return false
    if (filterDecision.value && h.decision !== filterDecision.value) return false
    return true
  })
})

const groupedHistory = computed(() => {
  const map = new Map<string, SubmissionItem[]>()
  for (const h of filteredHistory.value) {
    if (!map.has(h.quarter)) map.set(h.quarter, [])
    map.get(h.quarter)!.push(h)
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([quarter, items]) => ({ quarter, items }))
})

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function formatDate(d: string) {
  return d.slice(0, 10).replace(/-/g, '.')
}

onMounted(() => fetchHistory())
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 헤더 ───────────────────────────────────────────── */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: #94a3b8;
  font-family: inherit;
  padding: 0;
  margin-bottom: 10px;
  transition: color .13s;
}
.btn-back:hover { color: #4f46e5; }

.page-header__title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

/* ── 필터 바 ─────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .05em;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-select {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  font-size: 13px;
  font-family: inherit;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color .12s;
  min-width: 110px;
}
.filter-select--narrow { min-width: 80px; }
.filter-select:focus { border-color: #818cf8; background-color: #fff; }

.chip-row {
  display: flex;
  gap: 5px;
}

.chip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12.5px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  transition: border-color .12s, background .12s, color .12s;
  white-space: nowrap;
}
.chip:hover { border-color: #818cf8; color: #4f46e5; }
.chip--active { background: #eef2ff; border-color: #818cf8; color: #4338ca; font-weight: 700; }

.chip--keep.chip--active    { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.chip--dispose.chip--active { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

.filter-divider {
  width: 1px; height: 24px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.filter-result {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

/* ── 목록 카드 ───────────────────────────────────────── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

/* ── 분기 그룹 헤더 ──────────────────────────────────── */
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.group-header__quarter {
  font-size: 11.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.group-header__count {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  background: #e2e8f0;
  padding: 1px 7px;
  border-radius: 10px;
}

/* ── 항목 ────────────────────────────────────────────── */
.history-item {
  display: grid;
  grid-template-columns: 36px 1fr auto auto 20px;
  align-items: center;
  gap: 14px;
  padding: 13px 20px;
  border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  transition: background .12s;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background: #f8fafc; }
.history-item:hover .row-arrow { opacity: 1; color: #6366f1; }

.history-item__icon {
  width: 34px; height: 34px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.decision-icon--keep    { background: #f0fdf4; }
.decision-icon--dispose { background: #fef2f2; }

.history-item__info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.history-item__title {
  font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.history-item__appno { font-size: 11.5px; color: #94a3b8; }

.decision-badge {
  padding: 3px 10px; border-radius: 6px;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.decision-badge--keep    { background: #f0fdf4; color: #15803d; }
.decision-badge--dispose { background: #fef2f2; color: #dc2626; }

.history-item__date {
  font-size: 12px; color: #94a3b8;
  white-space: nowrap; flex-shrink: 0;
}

.row-arrow { color: #cbd5e1; opacity: 0; transition: opacity .12s, color .12s; }

.mono { font-family: 'JetBrains Mono', monospace; }

/* ── 스켈레톤 ────────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 58px; border-bottom: 1px solid #f8fafc;
  background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: #94a3b8;
}
.empty-state__icon {
  width: 52px; height: 52px; background: #f1f5f9; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
}
.empty-state p { font-size: 14px; font-weight: 500; }
</style>
