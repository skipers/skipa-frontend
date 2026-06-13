<template>
  <div class="my-patents-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">담당 특허 관리</h2>
        <p class="page-header__desc">담당 특허 현황과 검토 제출 이력을 확인하세요</p>
      </div>
    </div>

    <!-- 포트폴리오 현황 -->
    <div class="portfolio-stat">
      <div class="portfolio-stat__header">
        <span class="portfolio-stat__title">보유 특허 현황</span>
        <span class="portfolio-stat__total">전체 {{ portfolioTotal }}건</span>
      </div>
      <div class="portfolio-stat__bar">
        <div class="portfolio-stat__seg portfolio-stat__seg--active"
          :style="{ width: activePct + '%' }"
          :title="`유지 ${activeTotalItems}건`"
        />
        <div class="portfolio-stat__seg portfolio-stat__seg--expired"
          :style="{ width: (100 - activePct) + '%' }"
          :title="`소멸·포기 ${expiredPatents.length}건`"
        />
      </div>
      <div class="portfolio-stat__legend">
        <div class="portfolio-stat__legend-item">
          <span class="portfolio-stat__dot portfolio-stat__dot--active" />
          <span class="portfolio-stat__label">유지</span>
          <strong class="portfolio-stat__count">{{ activeTotalItems }}건</strong>
          <span class="portfolio-stat__pct">({{ activePct }}%)</span>
        </div>
        <div class="portfolio-stat__legend-item">
          <span class="portfolio-stat__dot portfolio-stat__dot--expired" />
          <span class="portfolio-stat__label">소멸·포기</span>
          <strong class="portfolio-stat__count">{{ expiredPatents.length }}건</strong>
          <span class="portfolio-stat__pct">({{ 100 - activePct }}%)</span>
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
        @click="activeTab = tab.value as 'active' | 'expired'"
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
                소멸 예정일 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'expiryDate' }">{{ sortIconChar('expiryDate') }}</span>
              </th>
              <th>기술 분야</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filteredActivePatents"
              :key="p.id"
              class="patent-row"
              @click="router.push(`/biz/patents/${p.id}`)"
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
            @update:page="fetchAllAssignedPatents"
          />
        </div>
      </div>
    </template>

    <!-- ── 소멸/포기 특허 ── -->
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
          <p>소멸 또는 포기된 특허가 없습니다.</p>
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
                소멸/포기일 <span class="sort-icon" :class="{ 'sort-icon--active': sortKey === 'expiryDate' }">{{ sortIconChar('expiryDate') }}</span>
              </th>
              <th>기술 분야</th>
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


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import { patentsApi } from '@/api/patents'

const router = useRouter()
const auth   = useAuthStore()
const loading = ref(false)
const error   = ref<string | null>(null)

// ── 탭 ──────────────────────────────────────────────
const activeTab = ref<'active' | 'expired'>('active')

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

// ── 검색 / 필터 ──────────────────────────────────────
const searchInput = ref('')
const searchQuery = ref('')

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

// ── 필터 + 정렬 적용 헬퍼 ────────────────────────────
function applySearchFilter(list: PatentItem[]): PatentItem[] {
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.applicationNumber.toLowerCase().includes(q) ||
    (p.techField && p.techField.toLowerCase().includes(q)) ||
    (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
  )
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
const filteredActivePatents = computed(() => applySort(applySearchFilter(activePatents.value)))

const filteredExpiredPatents = computed(() => {
  return applySort(applySearchFilter(expiredPatents.value))
})

// ── 탭별 카운트 ──────────────────────────────────────
const tabs = computed(() => [
  { value: 'active',  label: '유지중인 특허',  count: activeTotalItems.value },
  { value: 'expired', label: '소멸/포기 특허', count: expiredPatents.value.length },
])

// ── 요약 카드 ────────────────────────────────────────
const portfolioTotal = computed(() => activeTotalItems.value + expiredPatents.value.length)
const activePct = computed(() => {
  const total = portfolioTotal.value
  if (!total) return 0
  return Math.round(activeTotalItems.value / total * 100)
})

// ── AI 등급 ──────────────────────────────────────────
function aiScore(p: { id: number; grade: string | null }): number | null {
  if (!p.grade) return null
  const ranges: Record<string, [number, number]> = { S: [88, 97], A: [75, 87], B: [58, 74], C: [42, 57] }
  const [min, max] = ranges[p.grade] ?? [50, 60]
  return min + (p.id % (max - min + 1))
}

// ── 유틸 ────────────────────────────────────────────
function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function patentStatus(expiryDate?: string) {
  if (!expiryDate) return 'REGISTERED'
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'EXPIRED'
  return 'REGISTERED'
}

function expiryClass(d?: string) {
  if (!d) return ''
  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return 'expiry--expired'
  if (diff < 365) return 'expiry--soon'
  return ''
}



// ── 데이터 로드 ──────────────────────────────────────
const ACTIVE_STATUSES = new Set(['REGISTERED', 'APPLIED', 'PUBLISHED'])

async function fetchAllAssignedPatents() {
  loading.value = true
  error.value = null
  try {
    const res = await patentsApi.getAssignedPatents({ size: 500 })
    const all = res.items

    const mapped = all.map(i => ({
      id: i.id,
      title: i.title,
      applicationNumber: i.applicationNumber,
      applicationDate: i.applicationDate,
      expiryDate: i.expiryDate,
      techField: i.techField,
      tags: i.keywords,
      status: i.latestLegalStatus ?? '',
    }))

    activePatents.value  = mapped.filter(i => ACTIVE_STATUSES.has(i.status))
    expiredPatents.value = mapped.filter(i => !ACTIVE_STATUSES.has(i.status))
    activeTotalItems.value = activePatents.value.length
    activeTotalPages.value = 1
  } catch (e) {
    console.error('MyPatentsView/fetchAllAssignedPatents:', e)
    error.value = '특허 목록을 불러오는 데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllAssignedPatents()
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
.page-header__title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  margin: 0 0 4px; letter-spacing: -0.02em;
}
.page-header__desc { font-size: 13.5px; color: #64748b; margin: 0; }

/* ── 요약 카드 ────────────────────────────────────── */
/* ── 포트폴리오 현황 ──────────────────────────────── */
.portfolio-stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.portfolio-stat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.portfolio-stat__title { font-size: 14px; font-weight: 700; color: var(--color-text); }
.portfolio-stat__total { font-size: 13px; font-weight: 600; color: var(--color-text-muted); }

.portfolio-stat__bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  gap: 2px;
}
.portfolio-stat__seg { height: 100%; transition: width 0.4s cubic-bezier(.4,0,.2,1); }
.portfolio-stat__seg--active  { background: #6366f1; border-radius: 6px 0 0 6px; }
.portfolio-stat__seg--expired { background: #e2e8f0; border-radius: 0 6px 6px 0; }

.portfolio-stat__legend {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.portfolio-stat__legend-item { display: flex; align-items: center; gap: 6px; }
.portfolio-stat__dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.portfolio-stat__dot--active  { background: #6366f1; }
.portfolio-stat__dot--expired { background: #e2e8f0; border: 1px solid #cbd5e1; }
.portfolio-stat__label { font-size: 13px; color: var(--color-text-secondary); }
.portfolio-stat__count { font-size: 13px; font-weight: 700; color: var(--color-text); }
.portfolio-stat__pct   { font-size: 12px; color: var(--color-text-muted); }

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
/* ── 필터 바 ─────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  flex-wrap: wrap;
}
.filter-bar__group { display: flex; align-items: center; gap: 8px; }
.filter-bar__label { font-size: 12.5px; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
.filter-bar__select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 28px 4px 10px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  background: var(--color-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  min-width: 110px;
}
.filter-bar__select:focus { border-color: var(--color-primary); }
.filter-bar__divider { width: 1px; height: 18px; background: var(--color-border); flex-shrink: 0; }

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

/* ── AI 등급 ──────────────────────────────── */
.ai-grade-cell { display: flex; align-items: center; gap: 6px; }
.ai-grade-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.ai-grade--s { background: #eef2ff; color: #6366f1; }
.ai-grade--a { background: #edfdf6; color: #1d9c6e; }
.ai-grade--b { background: #eaf8fd; color: #2ea8cc; }
.ai-grade--c { background: #fff8ec; color: #c47a0a; }
.ai-grade--d { background: #fdf0f0; color: #c45050; }
.ai-grade-score { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); }

/* ── 결정 pill ────────────────────────────── */
.decision-pill {
  display: inline-block; padding: 2px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.decision-pill--keep    { background: #edfdf6; color: #1d9c6e; }
.decision-pill--dispose { background: #fdf0f0; color: #c45050; }
.decision-pill--none    { background: var(--color-surface-muted); color: var(--color-text-muted); }

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
