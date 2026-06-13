<template>
  <div class="search-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="page-header__left">
        <h2 class="page-header__title">특허 검색</h2>
        <p class="page-header__desc">전체 보유 특허를 검색하고 상세 정보를 확인하세요</p>
      </div>
    </div>

    <!-- 검색 바 + 필터 카드 -->
    <div class="filter-card">
      <!-- 검색 입력 -->
      <div class="search-bar">
        <span class="search-bar__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
        <input
          v-model="filters.q"
          type="text"
          class="search-bar__input"
          placeholder="특허명, 출원번호, 발명자, 키워드로 검색"
          @keydown.enter="fetchPatents(1)"
        />
        <button v-if="filters.q" class="search-bar__clear" @click="filters.q = ''; fetchPatents(1)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button class="search-bar__btn" @click="fetchPatents(1)">검색</button>
      </div>

      <!-- 필터 행 -->
      <div class="filter-row">
        <!-- 상태 -->
        <div class="filter-group">
          <label class="filter-label">상태</label>
          <div class="chip-group">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              class="chip"
              :class="{ 'chip--active': filters.status === opt.value }"
              @click="toggleStatus(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="filter-divider" />

        <!-- 국가 -->
        <div class="filter-group">
          <label class="filter-label">국가</label>
          <select class="filter-select" v-model="filters.country" @change="fetchPatents(1)">
            <option value="">전체</option>
            <option v-for="c in countryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <!-- 사업부 (Legal/Admin만) -->
        <template v-if="auth.isLegal || auth.isAdmin">
          <div class="filter-group">
            <label class="filter-label">사업부</label>
            <select class="filter-select" v-model="filters.departmentId" @change="fetchPatents(1)">
              <option :value="undefined">전체</option>
              <option v-for="d in deptOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
        </template>

        <!-- 필터 초기화 -->
        <button v-if="hasActiveFilters" class="filter-reset" @click="resetFilters">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
          </svg>
          초기화
        </button>
      </div>
    </div>

    <!-- 결과 카운트 -->
    <div class="result-bar">
      <p class="result-count">
        <template v-if="!loading">
          <span class="result-count__num">{{ totalItems.toLocaleString() }}</span>건
        </template>
        <span v-else class="result-count__loading">검색 중...</span>
      </p>
    </div>

    <!-- 테이블 카드 -->
    <div class="table-card">
      <PatentTable
        :items="displayItems"
        :loading="loading"
        @select="goToDetail"
        @sort="handleSort"
      />
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination-row">
      <BasePagination
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        @update:page="fetchPatents"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { patentsApi } from '@/api/patents'
import { departmentsApi } from '@/api/departments'
import { usePagination } from '@/composables/usePagination'
import PatentTable, { type PatentRow } from '@/components/patent/PatentTable.vue'
import BasePagination from '@/components/ui/BasePagination.vue'

const router = useRouter()
const auth   = useAuthStore()
const { page, size, totalPages, totalItems, setPage, setTotal } = usePagination()

// ── 상태 ────────────────────────────────────────────
const loading = ref(false)
const error   = ref<string | null>(null)
const tableItems = ref<PatentRow[]>([])

const filters = reactive({
  q:            '' as string,
  status:       '' as string,
  country:      '' as string,
  sort:         'expiryDate,asc' as string,
  departmentId: undefined as number | undefined,
})

// ── 정적 옵션 ────────────────────────────────────────
const statusOptions = [
  { value: '',           label: '전체'      },
  { value: 'REGISTERED', label: '등록'      },
  { value: 'EXPIRED',    label: '소멸/포기' },
]

// ── 동적 필터 옵션 ───────────────────────────────────
const countryOptions = [
  { value: 'KR',  label: '한국' },
  ...[
    { value: 'TW',  label: '대만' },
    { value: 'US',  label: '미국' },
    { value: 'UAE', label: '아랍에미리트' },
    { value: 'JP',  label: '일본' },
    { value: 'CN',  label: '중국' },
  ].sort((a, b) => a.label.localeCompare(b.label, 'ko')),
]
const deptOptions    = ref<{ id: number; name: string }[]>([])

async function fetchFilterOptions() {
  try {
    const departments = await departmentsApi.getDepartments()
    deptOptions.value = departments.items.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  } catch (e) {
    console.error('필터 옵션 로드 실패:', e)
  }
}

// ── 계산 ────────────────────────────────────────────
const hasActiveFilters = computed(() =>
  !!filters.q || !!filters.status || !!filters.country || !!filters.departmentId
)

const displayItems = computed(() => tableItems.value)

// ── 특허 목록 로드 ───────────────────────────────────
async function fetchPatents(p = page.value) {
  loading.value = true
  error.value   = null
  setPage(p)
  try {
    const statusParam: string[] | undefined =
      filters.status === 'EXPIRED'
        ? ['EXPIRED', 'ABANDONED', 'WITHDRAWN', 'INVALIDATED', 'REJECTED']
        : filters.status ? [filters.status] : undefined

    const res = await patentsApi.getPatents({
      keyword:      filters.q || undefined,
      status:       statusParam,
      filingCountry: filters.country || undefined,
      sort:         filters.sort || undefined,
      departmentId: filters.departmentId,
      page:         page.value,
      size:         size.value,
    })
    tableItems.value = res.items.map(item => ({
      ...item,
      status: item.latestLegalStatus,
    })) as PatentRow[]
    setTotal(res.totalItems, res.totalPages)
  } catch (e) {
    console.error('특허 목록 조회 실패:', e)
    error.value = '특허 목록을 불러오는 데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// ── 필터 토글 ────────────────────────────────────────
function toggleStatus(val: string) {
  filters.status = filters.status === val ? '' : val
  fetchPatents(1)
}

function resetFilters() {
  filters.q            = ''
  filters.status       = ''
  filters.country      = ''
  filters.sort         = 'expiryDate,asc'
  filters.departmentId = undefined
  fetchPatents(1)
}

function handleSort(key: string) {
  filters.sort = key
  fetchPatents(1)
}

// ── 상세 이동 ────────────────────────────────────────
function goToDetail(patent: PatentRow) {
  const base = auth.isLegal || auth.isAdmin ? '/legal' : '/biz'
  router.push(`${base}/patent-search/${patent.id}`)
}

// ── 초기 로드 ────────────────────────────────────────
onMounted(() => {
  fetchFilterOptions()
  fetchPatents(1)
})
</script>

<style scoped>
.search-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 페이지 헤더 ──────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.page-header__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin: 0;
}

/* ── 필터 카드 ────────────────────────────────────── */
.filter-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 검색 바 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface-soft);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar:focus-within {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.search-bar__icon {
  padding: 0 14px;
  color: var(--color-text-subtle);
  display: flex;
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  padding: 11px 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: var(--color-text);
  outline: none;
}
.search-bar__input::placeholder { color: var(--c-slate-300); }

.search-bar__clear {
  padding: 0 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  display: flex;
  transition: color 0.13s;
}
.search-bar__clear:hover { color: var(--c-slate-600); }

.search-bar__btn {
  padding: 0 20px;
  height: 100%;
  min-height: 44px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.13s;
  white-space: nowrap;
}
.search-bar__btn:hover { background: var(--color-navy-hover); }

/* 필터 행 */
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.filter-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  flex-shrink: 0;
}

.filter-select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 28px 4px 10px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--color-text-secondary);
  background: var(--color-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: border-color 0.12s;
}
.filter-select:focus { border-color: var(--color-primary); }

.chip-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chip {
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface-hover);
  color: var(--c-slate-600);
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
}
.chip:hover { background: var(--color-surface-muted); border-color: var(--c-slate-300); }
.chip--active {
  background: var(--color-text);
  border-color: var(--color-text);
  color: var(--color-surface);
}

.filter-reset {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: none;
  border: 1px solid var(--c-red-300);
  border-radius: 7px;
  color: var(--color-danger);
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s;
}
.filter-reset:hover { background: var(--color-danger-bg); }

/* ── 결과 바 ──────────────────────────────────────── */
.result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.result-count {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin: 0;
}
.result-count__num {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin-right: 2px;
}
.result-count__loading { color: var(--color-text-subtle); font-style: italic; }

.dept-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-sm {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  outline: none;
  cursor: pointer;
  transition: border-color 0.13s;
}
.select-sm:focus { border-color: var(--color-primary); }

/* ── 테이블 카드 ──────────────────────────────────── */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

/* ── 페이지네이션 ─────────────────────────────────── */
.pagination-row {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}


</style>
