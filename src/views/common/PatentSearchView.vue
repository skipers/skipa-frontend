<template>
  <div class="search-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="page-header__left">
        <h2 class="page-header__title">특허 검색</h2>
        <p class="page-header__desc">전체 보유 특허를 검색하고 상세 정보를 확인하세요</p>
      </div>
      <button class="btn-register" @click="goToRegister">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        특허 추가
      </button>
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
          <div class="chip-group">
            <button
              v-for="c in countryOptions"
              :key="c"
              class="chip"
              :class="{ 'chip--active': filters.country === c }"
              @click="toggleFilter('country', c)"
            >{{ c }}</button>
          </div>
        </div>

        <div class="filter-divider" />

        <!-- 정렬 -->
        <div class="filter-group">
          <label class="filter-label">정렬</label>
          <div class="chip-group">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              class="chip"
              :class="{ 'chip--active': filters.sort === opt.value }"
              @click="toggleFilter('sort', opt.value)"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- 필터 초기화 -->
        <button v-if="hasActiveFilters" class="filter-reset" @click="resetFilters">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
          </svg>
          초기화
        </button>
      </div>
    </div>

    <!-- 결과 카운트 + 사업부 필터 (Legal만) -->
    <div class="result-bar">
      <p class="result-count">
        <template v-if="!loading">
          <span class="result-count__num">{{ totalItems.toLocaleString() }}</span>건
        </template>
        <span v-else class="result-count__loading">검색 중...</span>
      </p>

      <div v-if="auth.isLegal || auth.isAdmin" class="dept-filter">
        <label class="filter-label">사업부</label>
        <select v-model="filters.departmentId" class="select-sm" @change="fetchPatents(1)">
          <option :value="undefined">전체</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
    </div>

    <!-- 테이블 카드 -->
    <div class="table-card">
      <PatentTable
        :items="tableItems"
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
import { usePagination } from '@/composables/usePagination'
import PatentTable, { type PatentRow } from '@/components/patent/PatentTable.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import type { Department } from '@/types'

const router  = useRouter()
const auth    = useAuthStore()
const { page, totalPages, totalItems, query: pageQuery, setPage, setTotal } = usePagination()

// ── 상태 ────────────────────────────────────────────
const loading = ref(false)
const tableItems = ref<PatentRow[]>([])
const departments = ref<Department[]>([])

const filters = reactive({
  q: '',
  status: '' as string,
  country: '' as string,
  sort: 'expiryDate' as string,
  departmentId: undefined as number | undefined,
})

// ── 옵션 ────────────────────────────────────────────
const statusOptions = [
  { value: '',              label: '전체'      },
  { value: 'REGISTERED',   label: '등록'      },
  { value: 'EXPIRING_SOON',label: '만료 예정' },
  { value: 'EXPIRED',      label: '만료/포기' },
]

const countryOptions = ['전체', 'KR', 'US', 'EP', 'JP', 'CN']

const sortOptions = [
  { value: 'expiryDate',       label: '만료일순'  },
  { value: 'applicationDate',  label: '출원일순'  },
  { value: 'citationCount',    label: '피인용순'  },
]

// ── 계산 ────────────────────────────────────────────
const hasActiveFilters = computed(() =>
  !!filters.q || !!filters.status || (filters.country && filters.country !== '전체') || !!filters.departmentId
)

// ── 특허 목록 로드 ───────────────────────────────────
async function fetchPatents(p = page.value) {
  loading.value = true
  setPage(p)
  try {
    const params: Record<string, unknown> = {
      ...pageQuery.value,
      q: filters.q || undefined,
      status: filters.status || undefined,
      filingCountry: filters.country && filters.country !== '전체' ? filters.country : undefined,
      sort: filters.sort || undefined,
      departmentId: filters.departmentId,
    }
    const res = await patentsApi.list(params as any)
    tableItems.value = res.items as PatentRow[]
    setTotal(res.totalItems, res.totalPages)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// ── 필터 토글 ────────────────────────────────────────
function toggleStatus(val: string) {
  filters.status = filters.status === val ? '' : val
  fetchPatents(1)
}

function toggleFilter(key: 'country' | 'sort', val: string) {
  if (key === 'country') {
    filters.country = filters.country === val ? '' : val
  } else {
    filters.sort = val
  }
  fetchPatents(1)
}

function resetFilters() {
  filters.q = ''
  filters.status = ''
  filters.country = ''
  filters.sort = 'expiryDate'
  filters.departmentId = undefined
  fetchPatents(1)
}

// ── 정렬 (테이블 헤더 클릭) ──────────────────────────
function handleSort(key: string) {
  filters.sort = key
  fetchPatents(1)
}

// ── 상세 이동 ────────────────────────────────────────
function goToDetail(patent: PatentRow) {
  const base = auth.isLegal || auth.isAdmin ? '/legal' : '/biz'
  router.push(`${base}/patent-search/${patent.id}`)
}

// ── 등록 페이지 이동 ─────────────────────────────────
function goToRegister() {
  const base = auth.isLegal || auth.isAdmin ? '/legal' : '/biz'
  router.push(`${base}/patents/new`)
}

// ── 초기 로드 ────────────────────────────────────────
onMounted(() => fetchPatents(1))
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
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
}

.btn-register {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.12s;
  white-space: nowrap;
}
.btn-register:hover { background: #1e293b; }
.btn-register:active { transform: scale(0.98); }

/* ── 필터 카드 ────────────────────────────────────── */
.filter-card {
  background: #fff;
  border: 1px solid #e2e8f0;
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
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar:focus-within {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.search-bar__icon {
  padding: 0 14px;
  color: #94a3b8;
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
  color: #0f172a;
  outline: none;
}
.search-bar__input::placeholder { color: #cbd5e1; }

.search-bar__clear {
  padding: 0 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  transition: color 0.13s;
}
.search-bar__clear:hover { color: #475569; }

.search-bar__btn {
  padding: 0 20px;
  height: 100%;
  min-height: 44px;
  background: #0f172a;
  color: #fff;
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.13s;
  white-space: nowrap;
}
.search-bar__btn:hover { background: #1e293b; }

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
  color: #64748b;
  white-space: nowrap;
}

.filter-divider {
  width: 1px;
  height: 18px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.chip-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chip {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
  color: #475569;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
}
.chip:hover { background: #f1f5f9; border-color: #cbd5e1; }
.chip--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
}

.filter-reset {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: none;
  border: 1px solid #fca5a5;
  border-radius: 7px;
  color: #dc2626;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s;
}
.filter-reset:hover { background: #fef2f2; }

/* ── 결과 바 ──────────────────────────────────────── */
.result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.result-count {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
}
.result-count__num {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-right: 2px;
}
.result-count__loading { color: #94a3b8; font-style: italic; }

.dept-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-sm {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #374151;
  background: #fff;
  outline: none;
  cursor: pointer;
  transition: border-color 0.13s;
}
.select-sm:focus { border-color: #6366f1; }

/* ── 테이블 카드 ──────────────────────────────────── */
.table-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}

/* ── 페이지네이션 ─────────────────────────────────── */
.pagination-row {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

/* ── 모달 ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(2px);
}

.modal {
  background: #fff;
  border-radius: 18px;
  width: min(580px, 94vw);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px 18px;
  border-bottom: 1px solid #f1f5f9;
}

.modal__title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modal__close {
  width: 32px; height: 32px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: background 0.13s;
}
.modal__close:hover { background: #e2e8f0; }

.modal__body {
  padding: 22px 26px;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 26px 22px;
  border-top: 1px solid #f1f5f9;
}

/* 탭 */
.register-tabs {
  display: flex;
  gap: 0;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #f8fafc;
}

.register-tab {
  flex: 1;
  padding: 9px;
  border: none;
  background: transparent;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  color: #64748b;
  transition: background 0.13s, color 0.13s;
}
.register-tab--active {
  background: #fff;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* 업로드 존 */
.upload-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: #fafafa;
}
.upload-zone:hover { border-color: #6366f1; background: #f8f8ff; }

.upload-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 24px;
}

.upload-zone__icon {
  width: 52px; height: 52px;
  background: #eef2ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  margin-bottom: 4px;
}

.upload-zone__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  text-align: center;
}

.upload-zone__sub {
  font-size: 12.5px;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

.upload-zone__file {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  padding: 0 20px;
}
.upload-zone__file button {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  margin-left: 4px;
}

/* 수동 입력 폼 */
.manual-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; gap: 12px; }
.form-row--2 > * { flex: 1; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field__label { font-size: 12.5px; font-weight: 600; color: #374151; }
.field__input {
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  font-family: inherit;
  color: #0f172a;
  background: #fafafa;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field__input:focus {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* 버튼 */
.btn-cancel {
  padding: 9px 20px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  color: #475569;
  transition: background 0.13s;
}
.btn-cancel:hover { background: #e2e8f0; }

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,70,229,0.3);
  transition: opacity 0.13s;
}
.btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 모달 전환 ────────────────────────────────────── */
.modal-enter-active { transition: opacity 0.2s; }
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { animation: modalUp 0.22s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes modalUp {
  from { transform: translateY(12px) scale(0.98); }
  to   { transform: translateY(0) scale(1); }
}
</style>
