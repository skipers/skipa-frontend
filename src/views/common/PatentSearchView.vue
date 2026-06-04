<template>
  <div class="search-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="page-header__left">
        <h2 class="page-header__title">특허 검색</h2>
        <p class="page-header__desc">전체 보유 특허를 검색하고 상세 정보를 확인하세요</p>
      </div>
      <!-- Legal만 등록 버튼 노출 -->
      <button v-if="auth.isLegal || auth.isAdmin" class="btn-register" @click="goToRegister">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        신규 특허 등록
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

    <!-- 신규 등록 모달 (간략) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRegisterModal" class="modal-overlay" @click.self="showRegisterModal = false">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">신규 특허 등록</h3>
              <button class="modal__close" @click="showRegisterModal = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="modal__body">
              <!-- PDF 업로드 탭 -->
              <div class="register-tabs">
                <button class="register-tab" :class="{ 'register-tab--active': registerMode === 'pdf' }" @click="registerMode = 'pdf'">
                  PDF 업로드
                </button>
                <button class="register-tab" :class="{ 'register-tab--active': registerMode === 'manual' }" @click="registerMode = 'manual'">
                  직접 입력
                </button>
              </div>

              <!-- PDF 모드 -->
              <div v-if="registerMode === 'pdf'" class="upload-zone" @dragover.prevent @drop.prevent="handleDrop">
                <input type="file" accept=".pdf" ref="fileInput" style="display:none" @change="handleFileSelect" />
                <div v-if="!uploadedFile" class="upload-zone__content" @click="(fileInput as HTMLInputElement)?.click()">
                  <div class="upload-zone__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p class="upload-zone__title">PDF 파일을 드래그하거나 클릭하여 업로드</p>
                  <p class="upload-zone__sub">AI가 특허 정보를 자동으로 추출합니다</p>
                </div>
                <div v-else class="upload-zone__file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>{{ uploadedFile.name }}</span>
                  <button @click="uploadedFile = null">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 수동 입력 모드 (간략 필드) -->
              <div v-else class="manual-form">
                <div class="form-row">
                  <div class="field">
                    <label class="field__label">특허명 *</label>
                    <input v-model="registerForm.title" type="text" class="field__input" placeholder="특허명 입력" />
                  </div>
                </div>
                <div class="form-row form-row--2">
                  <div class="field">
                    <label class="field__label">출원번호 *</label>
                    <input v-model="registerForm.applicationNumber" type="text" class="field__input" placeholder="10-2026-0000000" />
                  </div>
                  <div class="field">
                    <label class="field__label">등록번호</label>
                    <input v-model="registerForm.registrationNumber" type="text" class="field__input" placeholder="10-0000000" />
                  </div>
                </div>
                <div class="form-row form-row--2">
                  <div class="field">
                    <label class="field__label">출원일</label>
                    <input v-model="registerForm.applicationDate" type="date" class="field__input" />
                  </div>
                  <div class="field">
                    <label class="field__label">만료 예정일</label>
                    <input v-model="registerForm.expiryDate" type="date" class="field__input" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal__footer">
              <button class="btn-cancel" @click="showRegisterModal = false">취소</button>
              <button class="btn-confirm" :disabled="registerLoading" @click="handleRegister">
                <span v-if="registerLoading" class="spinner" />
                {{ registerMode === 'pdf' ? 'AI 추출 및 등록' : '등록' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { patentsApi } from '@/api/patents'
import { usePagination } from '@/composables/usePagination'
import PatentTable, { type PatentRow } from '@/components/patent/PatentTable.vue'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import type { Department } from '@/types'

const router  = useRouter()
const auth    = useAuthStore()
const { page, totalPages, totalItems, query: pageQuery, setPage, setTotal } = usePagination()

// ── 상태 ────────────────────────────────────────────
const loading = ref(false)
const tableItems = ref<PatentRow[]>([])
const departments = ref<Department[]>([])
const showRegisterModal = ref(false)
const registerMode = ref<'pdf' | 'manual'>('pdf')
const registerLoading = ref(false)
const uploadedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const filters = reactive({
  q: '',
  status: '' as string,
  country: '' as string,
  sort: 'expiryDate' as string,
  departmentId: undefined as number | undefined,
})

const registerForm = reactive({
  title: '',
  applicationNumber: '',
  registrationNumber: '',
  applicationDate: '',
  expiryDate: '',
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

// ── Mock 특허 목록 ──────────────────────────────────
const mockPatentRows: PatentRow[] = [
  { id: 1,  title: 'NF3 가스 이물질 제거 시스템',           applicationNumber: '10-2026-0012345', registrationNumber: '10-2450231', manageNumber: 'SKP-2026-001', applicationDate: '2024-03-15', expiryDate: '2026-08-15', status: 'EXPIRING_SOON', techField: '반도체' },
  { id: 2,  title: '플라즈마 식각 장치 및 제어 방법',         applicationNumber: '10-2025-0098732', registrationNumber: '10-2318740', manageNumber: 'SKP-2025-042', applicationDate: '2023-09-08', expiryDate: '2026-09-22', status: 'EXPIRING_SOON', techField: '반도체' },
  { id: 3,  title: '배터리 전극 코팅 균일도 향상 장치',       applicationNumber: '10-2025-0041200', registrationNumber: '10-2298100', manageNumber: 'SKP-2025-018', applicationDate: '2023-05-20', expiryDate: '2026-10-05', status: 'EXPIRING_SOON', techField: '배터리' },
  { id: 4,  title: '신소재 열 전도성 향상 방법',              applicationNumber: '10-2024-0081900', registrationNumber: '10-2201540', manageNumber: 'SKP-2024-033', applicationDate: '2022-11-12', expiryDate: '2027-01-20', status: 'REGISTERED',    techField: '소재'   },
  { id: 5,  title: 'AI 기반 품질 검사 자동화 시스템',         applicationNumber: '10-2026-0031891', registrationNumber: '10-2490010', manageNumber: 'SKP-2026-009', applicationDate: '2024-07-03', expiryDate: '2027-03-01', status: 'REGISTERED',    techField: 'AI/SW'  },
  { id: 6,  title: '반도체 세정 공정 최적화 방법',            applicationNumber: '10-2023-0055100', registrationNumber: '10-2102390', manageNumber: 'SKP-2023-021', applicationDate: '2021-08-17', expiryDate: '2026-07-10', status: 'EXPIRING_SOON', techField: '반도체' },
  { id: 7,  title: '리튬이온 배터리 수명 예측 알고리즘',      applicationNumber: '10-2025-0067432', registrationNumber: '10-2355820', manageNumber: 'SKP-2025-027', applicationDate: '2023-12-01', expiryDate: '2027-05-14', status: 'REGISTERED',    techField: '배터리' },
  { id: 8,  title: '고온 내열 소재 합성 공정',               applicationNumber: '10-2024-0012980', registrationNumber: '10-2188500', manageNumber: 'SKP-2024-005', applicationDate: '2022-04-29', expiryDate: '2026-11-30', status: 'REGISTERED',    techField: '소재'   },
  { id: 9,  title: '반도체 패키징 방열 구조 및 제조 방법',    applicationNumber: '10-2026-0044211', registrationNumber: '10-2502100', manageNumber: 'SKP-2026-015', applicationDate: '2024-09-10', expiryDate: '2027-02-08', status: 'REGISTERED',    techField: '반도체' },
  { id: 10, title: '신경망 기반 결함 검출 시스템',            applicationNumber: '10-2025-0029004', registrationNumber: '10-2277340', manageNumber: 'SKP-2025-011', applicationDate: '2023-04-14', expiryDate: '2027-07-22', status: 'REGISTERED',    techField: 'AI/SW'  },
  { id: 11, title: '전고체 배터리 전해질 조성물',             applicationNumber: '10-2024-0093100', registrationNumber: '10-2222870', manageNumber: 'SKP-2024-038', applicationDate: '2022-12-05', expiryDate: '2026-12-19', status: 'REGISTERED',    techField: '배터리' },
  { id: 12, title: '산화막 성장 제어 방법',                  applicationNumber: '10-2023-0077650', registrationNumber: '10-2133010', manageNumber: 'SKP-2023-031', applicationDate: '2021-11-22', expiryDate: '2027-04-03', status: 'REGISTERED',    techField: '반도체' },
  { id: 13, title: '나노 구조 촉매 제조 공정',               applicationNumber: '10-2022-0048300', registrationNumber: '10-2055980', manageNumber: 'SKP-2022-019', applicationDate: '2020-07-08', expiryDate: '2025-12-31', status: 'EXPIRED',       techField: '소재'   },
  { id: 14, title: '딥러닝 기반 공정 이상 감지 시스템',       applicationNumber: '10-2026-0020011', registrationNumber: '10-2465300', manageNumber: 'SKP-2026-004', applicationDate: '2024-05-16', expiryDate: '2028-01-10', status: 'REGISTERED',    techField: 'AI/SW'  },
  { id: 15, title: '차세대 배터리 전극 소재 합성법',          applicationNumber: '10-2025-0082100', registrationNumber: '10-2388200', manageNumber: 'SKP-2025-033', applicationDate: '2024-01-25', expiryDate: '2028-03-30', status: 'REGISTERED',    techField: '배터리' },
  { id: 16, title: '플렉서블 기판 반도체 제조 방법',          applicationNumber: '10-2023-0104500', registrationNumber: '10-2155640', manageNumber: 'SKP-2023-041', applicationDate: '2022-02-18', expiryDate: '2027-09-15', status: 'REGISTERED',    techField: '반도체' },
  { id: 17, title: '하이브리드 전력 제어 알고리즘',           applicationNumber: '10-2024-0061700', registrationNumber: '10-2210890', manageNumber: 'SKP-2024-025', applicationDate: '2022-09-30', expiryDate: '2027-06-08', status: 'REGISTERED',    techField: 'AI/SW'  },
  { id: 18, title: '탄소 나노튜브 복합 소재 제조',            applicationNumber: '10-2022-0031200', registrationNumber: '10-2044120', manageNumber: 'SKP-2022-013', applicationDate: '2020-05-12', expiryDate: '2025-09-20', status: 'EXPIRED',       techField: '소재'   },
  { id: 19, title: '식각 공정 부산물 회수 장치',              applicationNumber: '10-2026-0058900', registrationNumber: '10-2520770', manageNumber: 'SKP-2026-022', applicationDate: '2024-11-07', expiryDate: '2028-07-14', status: 'REGISTERED',    techField: '반도체' },
  { id: 20, title: '초고속 충전 배터리 관리 시스템',          applicationNumber: '10-2025-0011500', registrationNumber: '10-2260430', manageNumber: 'SKP-2025-005', applicationDate: '2023-02-28', expiryDate: '2028-05-03', status: 'REGISTERED',    techField: '배터리' },
]

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
  } catch {
    let filtered = [...mockPatentRows]
    if (filters.q) {
      const q = filters.q.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.applicationNumber.includes(q) ||
        p.manageNumber?.toLowerCase().includes(q)
      )
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }
    tableItems.value = filtered
    setTotal(filtered.length, 1)
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

// ── 파일 업로드 ──────────────────────────────────────
function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadedFile.value = file
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file?.type === 'application/pdf') uploadedFile.value = file
}

// ── 등록 페이지 이동 ─────────────────────────────────
function goToRegister() {
  const base = auth.isLegal || auth.isAdmin ? '/legal' : '/biz'
  router.push(`${base}/patents/new`)
}

// ── 등록 ────────────────────────────────────────────
async function handleRegister() {
  registerLoading.value = true
  try {
    if (registerMode.value === 'pdf' && uploadedFile.value) {
      const extracted = await patentsApi.extractFromPdf(uploadedFile.value)
      await patentsApi.create(extracted as any)
    } else {
      await patentsApi.create(registerForm as any)
    }
    showRegisterModal.value = false
    fetchPatents(1)
  } catch (e) {
    console.error(e)
  } finally {
    registerLoading.value = false
  }
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
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header__desc {
  font-size: 13.5px;
  color: var(--color-text-muted);
  margin: 0;
}

.btn-register {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, transform 0.12s;
  white-space: nowrap;
}
.btn-register:hover { background: var(--color-navy-hover); }
.btn-register:active { transform: scale(0.98); }

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
  background: var(--color-surface);
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
  border-bottom: 1px solid var(--color-surface-muted);
}

.modal__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.modal__close {
  width: 32px; height: 32px;
  background: var(--color-surface-muted);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background 0.13s;
}
.modal__close:hover { background: var(--color-border); }

.modal__body {
  padding: 22px 26px;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 26px 22px;
  border-top: 1px solid var(--color-surface-muted);
}

/* 탭 */
.register-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  overflow: hidden;
  margin-bottom: 20px;
  background: var(--color-surface-hover);
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
  color: var(--color-text-muted);
  transition: background 0.13s, color 0.13s;
}
.register-tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* 업로드 존 */
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--color-surface-soft);
}
.upload-zone:hover { border-color: var(--color-primary); background: var(--color-surface-soft); }

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
  background: var(--color-primary-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.upload-zone__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.upload-zone__sub {
  font-size: 12.5px;
  color: var(--color-text-subtle);
  margin: 0;
  text-align: center;
}

.upload-zone__file {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  padding: 0 20px;
}
.upload-zone__file button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  display: flex;
  margin-left: 4px;
}

/* 수동 입력 폼 */
.manual-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; gap: 12px; }
.form-row--2 > * { flex: 1; }
.field { display: flex; flex-direction: column; gap: 5px; }
.field__label { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); }
.field__input {
  padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 13.5px;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface-soft);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field__input:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* 버튼 */
.btn-cancel {
  padding: 9px 20px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  color: var(--c-slate-600);
  transition: background 0.13s;
}
.btn-cancel:hover { background: var(--color-border); }

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 22px;
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: var(--color-surface);
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
  border-top-color: var(--color-surface);
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
