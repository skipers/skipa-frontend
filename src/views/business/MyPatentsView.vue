<template>
  <div class="my-patents-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">{{ auth.user?.name ?? '사업부' }}</p>
        <h2 class="page-header__title">담당 특허 관리</h2>
        <p class="page-header__desc">담당 특허 현황과 검토 제출 이력을 확인하세요</p>
      </div>
    </div>

    <!-- 요약 카드 -->
    <div class="summary-row">
      <div class="summary-card" v-for="s in summaryCards" :key="s.label">
        <div class="summary-card__icon" :style="{ background: s.iconBg, color: s.iconColor }">
          <span v-html="s.icon" />
        </div>
        <div class="summary-card__info">
          <p class="summary-card__value">{{ s.value }}</p>
          <p class="summary-card__label">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span class="tab__badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ── 유지중인 특허 ── -->
    <template v-if="activeTab === 'active'">
      <div class="table-card">
        <div v-if="loading" class="skel-rows">
          <div class="skel-row" v-for="n in 6" :key="n" />
        </div>
        <div v-else-if="!activePatents.length" class="empty-state">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p>유지 중인 특허가 없습니다.</p>
        </div>
        <table v-else class="patent-table">
          <thead>
            <tr>
              <th>특허명</th>
              <th>출원번호</th>
              <th>출원일</th>
              <th>만료 예정일</th>
              <th>기술 분야</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in activePatents"
              :key="p.id"
              class="patent-row"
              @click="router.push(`/patents/${p.id}`)"
            >
              <td>
                <div class="patent-title-cell">
                  <span class="patent-title">{{ p.title }}</span>
                  <span v-if="p.manageNumber" class="patent-manage">{{ p.manageNumber }}</span>
                </div>
              </td>
              <td><span class="mono">{{ p.applicationNumber }}</span></td>
              <td>{{ formatDate(p.applicationDate) }}</td>
              <td>
                <span :class="expiryClass(p.expiryDate)">{{ formatDate(p.expiryDate) }}</span>
              </td>
              <td>
                <span v-if="p.techField" class="field-tag">{{ p.techField }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td><PatentStatusBadge :status="patentStatus(p.expiryDate)" /></td>
              <td>
                <svg class="row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="activeTotalPages > 1" class="table-footer">
          <BasePagination
            :page="activePage"
            :total-pages="activeTotalPages"
            :total-items="activeTotalItems"
            @update:page="fetchActivePatents"
          />
        </div>
      </div>
    </template>

    <!-- ── 만료(포기) 특허 ── -->
    <template v-if="activeTab === 'expired'">
      <div class="table-card">
        <div v-if="loading" class="skel-rows">
          <div class="skel-row" v-for="n in 4" :key="n" />
        </div>
        <div v-else-if="!expiredPatents.length" class="empty-state">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <p>만료 또는 포기된 특허가 없습니다.</p>
        </div>
        <table v-else class="patent-table">
          <thead>
            <tr>
              <th>특허명</th>
              <th>출원번호</th>
              <th>만료일</th>
              <th>기술 분야</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in expiredPatents"
              :key="p.id"
              class="patent-row patent-row--expired"
              @click="router.push(`/patents/${p.id}`)"
            >
              <td>
                <div class="patent-title-cell">
                  <span class="patent-title">{{ p.title }}</span>
                </div>
              </td>
              <td><span class="mono">{{ p.applicationNumber }}</span></td>
              <td><span class="expiry--expired">{{ formatDate(p.expiryDate) }}</span></td>
              <td>
                <span v-if="p.techField" class="field-tag">{{ p.techField }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td><PatentStatusBadge status="EXPIRED" /></td>
              <td>
                <svg class="row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ── 검토 제출 이력 ── -->
    <template v-if="activeTab === 'history'">
      <div class="table-card">
        <div v-if="loading" class="skel-rows">
          <div class="skel-row" v-for="n in 5" :key="n" />
        </div>
        <div v-else-if="!submissionHistory.length" class="empty-state">
          <div class="empty-state__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <p>제출 이력이 없습니다.</p>
        </div>
        <div v-else class="history-list">
          <div
            v-for="h in submissionHistory"
            :key="h.id"
            class="history-item"
            @click="router.push(`/patents/${h.patentId}`)"
          >
            <div class="history-item__decision-icon" :class="`decision-icon--${h.decision.toLowerCase()}`">
              {{ decisionEmoji(h.decision) }}
            </div>
            <div class="history-item__info">
              <p class="history-item__title">{{ h.patentTitle }}</p>
              <p class="history-item__meta">
                <span class="mono">{{ h.applicationNumber }}</span>
                <span v-if="h.comment" class="history-item__comment">{{ h.comment }}</span>
              </p>
            </div>
            <div class="history-item__right">
              <span class="decision-badge" :class="`decision-badge--${h.decision.toLowerCase()}`">
                {{ decisionLabel(h.decision) }}
              </span>
              <p class="history-item__date">{{ formatDate(h.decidedAt) }}</p>
            </div>
            <svg class="row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>

        <div v-if="historyTotalPages > 1" class="table-footer">
          <BasePagination
            :page="historyPage"
            :total-pages="historyTotalPages"
            :total-items="historyTotalItems"
            @update:page="fetchHistory"
          />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { patentsApi } from '@/api/patents'
import { inboxApi } from '@/api/misc'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import BasePagination from '@/components/ui/BasePagination.vue'

const router = useRouter()
const auth   = useAuthStore()
const loading = ref(false)

// ── 탭 ──────────────────────────────────────────────
const activeTab = ref<'active' | 'expired' | 'history'>('active')

// ── 특허 데이터 ──────────────────────────────────────
interface PatentItem {
  id: number; title: string; applicationNumber: string
  manageNumber?: string; applicationDate?: string
  expiryDate?: string; techField?: string
}

const activePatents  = ref<PatentItem[]>([])
const expiredPatents = ref<PatentItem[]>([])

const activePage       = ref(1)
const activeTotalPages = ref(1)
const activeTotalItems = ref(0)

// ── 제출 이력 ────────────────────────────────────────
interface SubmissionItem {
  id: number; patentId: number; patentTitle: string
  applicationNumber: string; decision: string
  comment?: string; decidedAt: string
}

const submissionHistory  = ref<SubmissionItem[]>([])
const historyPage        = ref(1)
const historyTotalPages  = ref(1)
const historyTotalItems  = ref(0)

// ── 탭별 카운트 ──────────────────────────────────────
const tabs = computed(() => [
  { value: 'active',  label: '유지중인 특허',    count: activeTotalItems.value },
  { value: 'expired', label: '만료(포기) 특허',  count: expiredPatents.value.length },
  { value: 'history', label: '검토 제출 이력',   count: historyTotalItems.value },
])

// ── 요약 카드 ────────────────────────────────────────
const summaryCards = computed(() => [
  {
    label: '유지중', value: activeTotalItems.value,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    iconBg: '#f0fdf4', iconColor: '#22c55e',
  },
  {
    label: '만료 예정 (1년)',
    value: activePatents.value.filter(p => {
      if (!p.expiryDate) return false
      const diff = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff < 365
    }).length,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    iconBg: '#fffbeb', iconColor: '#f59e0b',
  },
  {
    label: '만료(포기)', value: expiredPatents.value.length,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    iconBg: '#fef2f2', iconColor: '#ef4444',
  },
  {
    label: '제출 완료', value: historyTotalItems.value,
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    iconBg: '#eef2ff', iconColor: '#6366f1',
  },
])

// ── 유틸 ────────────────────────────────────────────
function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function patentStatus(expiryDate?: string) {
  if (!expiryDate) return 'REGISTERED'
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return 'EXPIRED'
  if (diff < 365) return 'EXPIRING_SOON'
  return 'REGISTERED'
}

function expiryClass(d?: string) {
  if (!d) return ''
  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return 'expiry--expired'
  if (diff < 365) return 'expiry--soon'
  return ''
}

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}
function decisionEmoji(d: string) {
  return { KEEP: '✅', DISPOSE: '🗑' }[d] ?? '—'
}

// ── 데이터 로드 ──────────────────────────────────────
async function fetchActivePatents(p = 1) {
  loading.value = true
  activePage.value = p
  try {
    const res = await patentsApi.list({ page: p, size: 15 })
    // 실제 API에 status 필터 붙으면: patentsApi.list({ status: 'REGISTERED', page: p })
    activePatents.value   = res.items as PatentItem[]
    activeTotalItems.value = res.totalItems
    activeTotalPages.value = res.totalPages
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function fetchExpiredPatents() {
  try {
    const res = await patentsApi.list({ page: 1, size: 50 })
    // 실제: patentsApi.list({ status: 'EXPIRED' })
    expiredPatents.value = res.items.filter((p: any) => {
      if (!p.expiryDate) return false
      return new Date(p.expiryDate).getTime() < Date.now()
    }) as PatentItem[]
  } catch (e) { console.error(e) }
}

async function fetchHistory(p = 1) {
  historyPage.value = p
  try {
    const res = await inboxApi.list({ status: 'done', page: p, size: 15 })
    submissionHistory.value = res.items
      .filter(i => i.decision !== null)
      .map(i => ({
        id: i.decisionId,
        patentId: i.patentId,
        patentTitle: i.title,
        applicationNumber: '',
        decision: i.decision!,
        decidedAt: i.decidedAt ?? '',
      }))
    historyTotalItems.value = res.totalItems
    historyTotalPages.value = res.totalPages
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await Promise.all([
    fetchActivePatents(1),
    fetchExpiredPatents(),
    fetchHistory(1),
  ])
})
</script>

<style scoped>
.my-patents-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header__eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; color: var(--c-green-400); margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700; color: var(--color-text);
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

/* ── 요약 카드 ────────────────────────────────────── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 800px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

.summary-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow .15s;
}
.summary-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,.06); }

.summary-card__icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.summary-card__value {
  font-size: 22px; font-weight: 800; color: var(--color-text);
  letter-spacing: -.03em; line-height: 1; margin: 0 0 3px;
}
.summary-card__label { font-size: 12px; color: var(--color-text-muted); margin: 0; font-weight: 500; }

/* ── 탭 ─────────────────────────────────────────── */
.tabs {
  display: flex; gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
}

.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: var(--color-text-muted);
  position: relative; transition: color .13s; white-space: nowrap;
}
.tab:hover { color: var(--color-text); }
.tab--active { color: var(--color-primary-dark); font-weight: 700; }
.tab--active::after {
  content: ''; position: absolute;
  bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: var(--color-primary-dark); border-radius: 2px 2px 0 0;
}

.tab__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px;
  background: var(--color-surface-muted); color: var(--color-text-muted);
  border-radius: 10px; font-size: 11px; font-weight: 700;
}

/* ── 테이블 카드 ─────────────────────────────────── */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

.patent-table {
  width: 100%; border-collapse: collapse; font-size: 13.5px;
}

.patent-table thead tr { border-bottom: 1.5px solid var(--color-border); }

.patent-table th {
  padding: 10px 16px;
  text-align: left; font-size: 11.5px; font-weight: 600;
  color: var(--color-text-muted); letter-spacing: .02em; text-transform: uppercase;
  white-space: nowrap;
}

.patent-row {
  border-bottom: 1px solid var(--color-surface-muted);
  cursor: pointer; transition: background .12s;
}
.patent-row:last-child { border-bottom: none; }
.patent-row:hover { background: var(--color-surface-hover); }
.patent-row--expired { opacity: 0.7; }
.patent-row:hover .row-arrow { opacity: 1; color: var(--color-primary); }

.patent-table td { padding: 14px 16px; vertical-align: middle; }

.patent-title-cell { display: flex; flex-direction: column; gap: 3px; }
.patent-title {
  font-size: 13.5px; font-weight: 600; color: var(--color-text); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.patent-manage { font-size: 11.5px; color: var(--color-text-subtle); font-family: monospace; }

.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: var(--c-slate-600); }

.expiry--soon    { color: var(--color-warn-dark); font-weight: 600; }
.expiry--expired { color: var(--color-danger); font-weight: 600; }

.field-tag {
  display: inline-block; padding: 2px 8px;
  background: var(--color-surface-muted); border-radius: 5px;
  font-size: 12px; color: var(--c-slate-600); font-weight: 500;
}
.text-muted { color: var(--c-slate-300); }

.row-arrow {
  color: var(--c-slate-300); opacity: 0;
  transition: opacity .12s, color .12s;
}

/* ── 제출 이력 목록 ───────────────────────────────── */
.history-list { display: flex; flex-direction: column; }

.history-item {
  display: grid;
  grid-template-columns: 40px 1fr auto 24px;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  cursor: pointer;
  transition: background .12s;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background: var(--color-surface-hover); }
.history-item:hover .row-arrow { opacity: 1; color: var(--color-primary); }

.history-item__decision-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.decision-icon--keep    { background: var(--color-success-bg); }
.decision-icon--sell    { background: var(--color-primary-bg); }
.decision-icon--dispose { background: var(--color-danger-bg); }

.history-item__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.history-item__title {
  font-size: 13.5px; font-weight: 600; color: var(--color-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;
}
.history-item__meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--color-text-subtle);
}
.history-item__comment {
  font-size: 12px; color: var(--color-text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 200px;
}

.history-item__right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
}

.decision-badge {
  padding: 3px 10px; border-radius: 6px;
  font-size: 12.5px; font-weight: 700;
}
.decision-badge--keep    { background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-badge--sell    { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.decision-badge--dispose { background: var(--color-danger-bg); color: var(--color-danger); }

.history-item__date { font-size: 11.5px; color: var(--color-text-subtle); margin: 0; }

/* ── 스켈레톤 ────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 58px; border-bottom: 1px solid var(--color-surface-hover);
  background: linear-gradient(90deg, var(--color-surface-hover) 25%, var(--color-surface-muted) 50%, var(--color-surface-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: var(--color-text-subtle);
}
.empty-state__icon {
  width: 52px; height: 52px; background: var(--color-surface-muted); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.empty-state p { font-size: 14px; font-weight: 500; }

/* ── 테이블 푸터 ─────────────────────────────────── */
.table-footer {
  display: flex; justify-content: center;
  padding: 16px; border-top: 1px solid var(--color-surface-muted);
}
</style>
