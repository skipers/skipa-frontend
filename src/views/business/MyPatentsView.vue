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
        @click="activeTab = tab.value as 'active' | 'expired' | 'history'"
      >
        {{ tab.label }}
        <span class="tab__badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ── 유지중인 특허 ── -->
    <template v-if="activeTab === 'active'">
      <div class="table-card">
        <!-- 툴바 -->
        <div class="table-toolbar">
          <div class="toolbar-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              v-model="searchInput"
              class="search-input"
              placeholder="특허명, 출원번호, 기술 분야 검색..."
              type="text"
              @keyup.enter="doSearch"
            />
            <button v-if="searchInput" class="search-clear" @click="clearSearch">×</button>
          </div>
          <button class="btn-search" @click="doSearch">검색</button>
        </div>

        <div v-if="loading" class="skel-rows">
          <div class="skel-row" v-for="n in 6" :key="n" />
        </div>
        <div v-else-if="!filteredActivePatents.length" class="empty-state">
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
              <th class="sortable" @click="toggleSort('applicationNumber')">
                출원번호 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'applicationNumber' }">{{ sortIconChar('applicationNumber') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('title')">
                특허명 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'title' }">{{ sortIconChar('title') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('applicationDate')">
                출원일 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'applicationDate' }">{{ sortIconChar('applicationDate') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('expiryDate')">
                만료 예정일 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'expiryDate' }">{{ sortIconChar('expiryDate') }}</span>
              </th>
              <th class="th-with-filter">
                <div class="th-label">기술 분야<span v-if="filterTechField" class="filter-dot" /></div>
                <select v-model="filterTechField" class="col-filter-select" @click.stop>
                  <option value="">전체</option>
                  <option v-for="f in techFieldOptions" :key="f" :value="f">{{ f }}</option>
                </select>
              </th>
              <th class="th-with-filter">
                <div class="th-label">상태<span v-if="filterStatus" class="filter-dot" /></div>
                <select v-model="filterStatus" class="col-filter-select" @click.stop>
                  <option value="">전체</option>
                  <option value="REGISTERED">등록</option>
                  <option value="EXPIRING_SOON">만료 예정</option>
                </select>
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filteredActivePatents"
              :key="p.id"
              class="patent-row"
              @click="router.push(`/biz/patent-search/${p.id}?from=management`)"
            >
              <td><span class="mono">{{ p.applicationNumber }}</span></td>
              <td>
                <div class="patent-title-cell">
                  <span class="patent-title">{{ p.title }}</span>
                  <div v-if="p.tags && p.tags.length" class="tag-row">
                    <span v-for="tag in p.tags" :key="tag" class="kw-tag">{{ tag }}</span>
                  </div>
                </div>
              </td>
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

    <!-- ── 만료/포기 특허 ── -->
    <template v-if="activeTab === 'expired'">
      <div class="table-card">
        <!-- 툴바 -->
        <div class="table-toolbar">
          <div class="toolbar-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              v-model="searchInput"
              class="search-input"
              placeholder="특허명, 출원번호, 기술 분야 검색..."
              type="text"
              @keyup.enter="doSearch"
            />
            <button v-if="searchInput" class="search-clear" @click="clearSearch">×</button>
          </div>
          <button class="btn-search" @click="doSearch">검색</button>
        </div>

        <div v-if="loading" class="skel-rows">
          <div class="skel-row" v-for="n in 4" :key="n" />
        </div>
        <div v-else-if="!filteredExpiredPatents.length" class="empty-state">
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
              <th class="sortable" @click="toggleSort('applicationNumber')">
                출원번호 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'applicationNumber' }">{{ sortIconChar('applicationNumber') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('title')">
                특허명 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'title' }">{{ sortIconChar('title') }}</span>
              </th>
              <th class="sortable" @click="toggleSort('expiryDate')">
                만료/포기일 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'expiryDate' }">{{ sortIconChar('expiryDate') }}</span>
              </th>
              <th class="th-with-filter">
                <div class="th-label">기술 분야<span v-if="filterTechField" class="filter-dot" /></div>
                <select v-model="filterTechField" class="col-filter-select" @click.stop>
                  <option value="">전체</option>
                  <option v-for="f in techFieldOptions" :key="f" :value="f">{{ f }}</option>
                </select>
              </th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filteredExpiredPatents"
              :key="p.id"
              class="patent-row patent-row--expired"
              @click="router.push(`/biz/patents/${p.id}?from=management`)"
            >
              <td><span class="mono">{{ p.applicationNumber }}</span></td>
              <td>
                <div class="patent-title-cell">
                  <span class="patent-title">{{ p.title }}</span>
                  <div v-if="p.tags && p.tags.length" class="tag-row">
                    <span v-for="tag in p.tags" :key="tag" class="kw-tag">{{ tag }}</span>
                  </div>
                </div>
              </td>
              <td><span class="expiry--expired">{{ formatDate(p.expiryDate) }}</span></td>
              <td>
                <span v-if="p.techField" class="field-tag">{{ p.techField }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td><PatentStatusBadge :status="p.status ?? 'EXPIRED'" /></td>
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
            @click="router.push(`/biz/patent-search/${h.patentId}?from=management`)"
          >
            <div class="history-item__decision-icon" :class="`decision-icon--${h.decision.toLowerCase()}`">
              <!-- 유지: outline circle check -->
              <svg v-if="h.decision === 'KEEP'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <!-- 포기: trash outline -->
              <svg v-else-if="h.decision === 'DISPOSE'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
              <span v-else class="text-muted">—</span>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import { MOCK_PATENTS, MOCK_REEVAL } from '@/mocks/data'

const router = useRouter()
const auth   = useAuthStore()
const loading = ref(false)

// ── 탭 ──────────────────────────────────────────────
const activeTab = ref<'active' | 'expired' | 'history'>('active')

// ── 특허 데이터 ──────────────────────────────────────
interface PatentItem {
  id: number; title: string; applicationNumber: string
  manageNumber?: string; applicationDate?: string
  expiryDate?: string; techField?: string; tags?: string[]
  status?: string
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

// ── 검색 / 필터 ──────────────────────────────────────
const searchInput    = ref('')
const searchQuery    = ref('')
const filterTechField = ref('')
const filterStatus   = ref('')

function doSearch() {
  searchQuery.value = searchInput.value
}
function clearSearch() {
  searchInput.value = ''
  searchQuery.value = ''
}

// ── 정렬 ────────────────────────────────────────────
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

watch(activeTab, () => {
  sortKey.value = ''
  sortDir.value = 'asc'
})

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function sortIconChar(key: string) {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

// ── 기술 분야 옵션 ───────────────────────────────────
const techFieldOptions = computed(() => {
  const all = [...activePatents.value, ...expiredPatents.value]
  return [...new Set(all.map(p => p.techField).filter(Boolean))] as string[]
})

// ── 필터 + 정렬 적용 헬퍼 ────────────────────────────
function applySearchFilter(list: PatentItem[]): PatentItem[] {
  let result = list
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.applicationNumber.toLowerCase().includes(q) ||
      (p.techField && p.techField.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    )
  }
  if (filterTechField.value) {
    result = result.filter(p => p.techField === filterTechField.value)
  }
  return result
}

function applySort(list: PatentItem[]): PatentItem[] {
  if (!sortKey.value) return list
  return [...list].sort((a, b) => {
    const av = (a as any)[sortKey.value] ?? ''
    const bv = (b as any)[sortKey.value] ?? ''
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })
}

// ── 계산된 필터/정렬 결과 ────────────────────────────
const filteredActivePatents = computed(() => {
  let list = applySearchFilter(activePatents.value)
  if (filterStatus.value) {
    list = list.filter(p => patentStatus(p.expiryDate) === filterStatus.value)
  }
  return applySort(list)
})

const filteredExpiredPatents = computed(() => {
  return applySort(applySearchFilter(expiredPatents.value))
})

// ── 탭별 카운트 ──────────────────────────────────────
const tabs = computed(() => [
  { value: 'active',  label: '유지중인 특허',   count: activeTotalItems.value },
  { value: 'expired', label: '만료/포기 특허',  count: expiredPatents.value.length },
  { value: 'history', label: '검토 제출 이력',  count: historyTotalItems.value },
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
    label: '만료/포기', value: expiredPatents.value.length,
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


// ── 데이터 로드 (반도체사업부 기준) ─────────────────
function fetchActivePatents(_p = 1) {
  const mine = MOCK_PATENTS.filter(p => p.dept === '반도체사업부' && p.status !== 'EXPIRED')
  activePatents.value = mine.map(p => ({
    id: p.id,
    title: p.title,
    applicationNumber: p.applicationNumber,
    applicationDate: p.applicationDate,
    expiryDate: p.expiryDate,
    techField: p.techField,
    tags: p.tags,
  }))
  activeTotalItems.value = mine.length
  activeTotalPages.value = 1
}

function fetchExpiredPatents() {
  expiredPatents.value = MOCK_PATENTS
    .filter(p => p.dept === '반도체사업부' && (p.status === 'EXPIRED' || p.status === 'ABANDONED'))
    .map(p => ({
      id: p.id,
      title: p.title,
      applicationNumber: p.applicationNumber,
      expiryDate: p.expiryDate,
      techField: p.techField,
      tags: p.tags,
      status: p.status,
    }))
}

function fetchHistory(_p = 1) {
  const done = MOCK_REEVAL.filter(r => r.deptId === 2 && r.decision !== null)
  submissionHistory.value = done.map(r => {
    const patent = MOCK_PATENTS.find(p => p.id === r.patentId)!
    return {
      id: r.patentId,
      patentId: r.patentId,
      patentTitle: patent.title,
      applicationNumber: patent.applicationNumber,
      decision: r.decision!,
      comment: '',
      decidedAt: r.decidedAt ?? '',
    }
  })
  historyTotalItems.value = done.length
  historyTotalPages.value = 1
}

onMounted(() => {
  fetchActivePatents(1)
  fetchExpiredPatents()
  fetchHistory(1)
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
  text-transform: uppercase; color: #10b981; margin: 0 0 5px;
}
.page-header__title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

/* ── 요약 카드 ────────────────────────────────────── */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 800px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }

.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
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
  font-size: 22px; font-weight: 800; color: #0f172a;
  letter-spacing: -.03em; line-height: 1; margin: 0 0 3px;
}
.summary-card__label { font-size: 12px; color: #64748b; margin: 0; font-weight: 500; }

/* ── 탭 ─────────────────────────────────────────── */
.tabs {
  display: flex; gap: 4px;
  border-bottom: 1.5px solid #e2e8f0;
}

.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: #64748b;
  position: relative; transition: color .13s; white-space: nowrap;
}
.tab:hover { color: #0f172a; }
.tab--active { color: #4f46e5; font-weight: 700; }
.tab--active::after {
  content: ''; position: absolute;
  bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5; border-radius: 2px 2px 0 0;
}

.tab__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px;
  background: #f1f5f9; color: #64748b;
  border-radius: 10px; font-size: 11px; font-weight: 700;
}

/* ── 테이블 카드 ─────────────────────────────────── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

/* ── 툴바 ────────────────────────────────────────── */
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
  flex-wrap: wrap;
}

.toolbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 10px;
  transition: border-color .13s;
}
.toolbar-search:focus-within { border-color: #818cf8; }

.search-icon { color: #94a3b8; flex-shrink: 0; }

.search-input {
  flex: 1;
  border: none; outline: none;
  font-size: 13px; color: #0f172a;
  background: transparent;
  font-family: inherit;
}
.search-input::placeholder { color: #cbd5e1; }

.search-clear {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; font-size: 16px; line-height: 1;
  padding: 0 2px; transition: color .12s;
}
.search-clear:hover { color: #475569; }

.btn-search {
  height: 34px;
  padding: 0 16px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background .13s, transform .1s;
}
.btn-search:hover { background: #4338ca; }
.btn-search:active { transform: scale(.97); }

/* ── 테이블 ──────────────────────────────────────── */
.patent-table {
  width: 100%; border-collapse: collapse; font-size: 13.5px;
}

.patent-table thead tr { border-bottom: 1.5px solid #e2e8f0; }

.patent-table th {
  padding: 10px 16px;
  text-align: left; font-size: 11.5px; font-weight: 600;
  color: #64748b; letter-spacing: .02em; text-transform: uppercase;
  white-space: nowrap;
}

/* 필터 드롭다운 내장 헤더 */
.th-with-filter {
  padding: 8px 16px !important;
  vertical-align: top;
}

.th-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 5px;
  font-size: 11.5px; font-weight: 600;
  color: #64748b; letter-spacing: .02em; text-transform: uppercase;
}

.filter-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #4f46e5;
  flex-shrink: 0;
}

.col-filter-select {
  display: block;
  width: 100%;
  height: 26px;
  padding: 0 20px 0 7px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11.5px; font-family: inherit; color: #374151;
  background: #fff url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2394a3b8' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 7px center;
  appearance: none;
  cursor: pointer;
  transition: border-color .13s;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}
.col-filter-select:focus { outline: none; border-color: #818cf8; }

.patent-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color .12s;
}
.patent-table th.sortable:hover { color: #4f46e5; }

.sort-icon {
  display: inline-block;
  margin-left: 4px;
  font-size: 10px;
  color: #cbd5e1;
  vertical-align: middle;
  transition: color .12s;
}
.sort-icon--active { color: #4f46e5; }

.patent-row {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer; transition: background .12s;
}
.patent-row:last-child { border-bottom: none; }
.patent-row:hover { background: #f8fafc; }
.patent-row--expired { opacity: 0.7; }
.patent-row:hover .row-arrow { opacity: 1; color: #6366f1; }

.patent-table td { padding: 14px 16px; vertical-align: middle; }

.patent-title-cell { display: flex; flex-direction: column; gap: 5px; }
.patent-title {
  font-size: 13.5px; font-weight: 600; color: #0f172a; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.patent-manage { font-size: 11.5px; color: #94a3b8; font-family: monospace; }

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.kw-tag {
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}

.mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #475569; }

.expiry--soon    { color: #b45309; font-weight: 600; }
.expiry--expired { color: #dc2626; font-weight: 600; }

.field-tag {
  display: inline-block; padding: 2px 8px;
  background: #f1f5f9; border-radius: 5px;
  font-size: 12px; color: #475569; font-weight: 500;
}
.text-muted { color: #cbd5e1; }

.row-arrow {
  color: #cbd5e1; opacity: 0;
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
  border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  transition: background .12s;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background: #f8fafc; }
.history-item:hover .row-arrow { opacity: 1; color: #6366f1; }

.history-item__decision-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.decision-icon--keep    { background: #f0fdf4; }
.decision-icon--sell    { background: #eef2ff; }
.decision-icon--dispose { background: #fef2f2; }

.history-item__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.history-item__title {
  font-size: 13.5px; font-weight: 600; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0;
}
.history-item__meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #94a3b8;
}
.history-item__comment {
  font-size: 12px; color: #64748b;
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
.decision-badge--keep    { background: #f0fdf4; color: #15803d; }
.decision-badge--sell    { background: #eef2ff; color: #4338ca; }
.decision-badge--dispose { background: #fef2f2; color: #dc2626; }

.history-item__date { font-size: 11.5px; color: #94a3b8; margin: 0; }

/* ── 스켈레톤 ────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 58px; border-bottom: 1px solid #f8fafc;
  background: linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; color: #94a3b8;
}
.empty-state__icon {
  width: 52px; height: 52px; background: #f1f5f9; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.empty-state p { font-size: 14px; font-weight: 500; }

/* ── 테이블 푸터 ─────────────────────────────────── */
.table-footer {
  display: flex; justify-content: center;
  padding: 16px; border-top: 1px solid #f1f5f9;
}
</style>
