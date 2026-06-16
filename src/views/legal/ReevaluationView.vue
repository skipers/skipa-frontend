<template>
  <div class="reeval-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <h2 class="page-header__title">재평가 관리</h2>
        <p class="page-header__desc">이번 분기 처리할 특허 목록을 관리하고 사업부에 검토를 요청합니다</p>
      </div>
      <div class="deadline-block">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="deadline-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span class="deadline-label">재평가 기한</span>
        <span class="deadline-date">{{ globalDueDate }}</span>
        <button class="btn-change-deadline" @click="openDueDateModal">변경</button>
      </div>
    </div>

    <!-- 진행 요약 바 -->
    <div class="progress-bar-card">
      <p class="progress-bar-card__quarter">{{ quarterLabel }}</p>
      <div class="progress-bar-card__top">
        <div class="progress-bar-card__info">
          <span class="progress-bar-card__label">
            전체 <strong>{{ statusCounts.all }}</strong>건 중
            <strong class="progress-bar-card__done">{{ statusCounts.done }}</strong>건 완료
          </span>
          <span class="progress-bar-card__pct">{{ progressPct }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>
    </div>

    <!-- 필터 탭 -->
    <div class="filter-tabs">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ 'filter-tab--active': activeStatus === tab.value }"
        @click="activeStatus = tab.value; fetchList(1)"
      >
        {{ tab.label }}
        <span v-if="tab.count != null" class="filter-tab__badge" :class="{ 'filter-tab__badge--red': tab.alert }">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- 세부 필터 바 (사업부 + 결정) -->
    <div class="sub-filter-bar">
      <div class="sub-filter-group">
        <span class="sub-filter-group__label">사업부</span>
        <select
          class="sub-filter-select"
          :value="activeDept ?? ''"
          @change="activeDept = ($event.target as HTMLSelectElement).value !== '' ? Number(($event.target as HTMLSelectElement).value) : null; fetchList(1)"
        >
          <option value="">전체</option>
          <option value="-1">미배정</option>
          <option v-for="d in sortedDepartments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>
      <div class="sub-filter-divider" />
      <div class="sub-filter-group">
        <span class="sub-filter-group__label">결정</span>
        <button
          v-for="opt in decisionOpts"
          :key="opt.value ?? 'null'"
          class="sub-filter-btn"
          :class="{ 'sub-filter-btn--active': activeDecision === opt.value }"
          @click="activeDecision = opt.value; fetchList(1)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- 선택된 항목 액션 바 -->
    <Transition name="slide-down">
      <div v-if="selectedIds.size > 0" class="action-bar">
        <span class="action-bar__count">{{ selectedIds.size }}건 선택됨</span>
        <div class="action-bar__btns">
          <button class="action-btn" @click="openBulkAssign">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            사업부 일괄 배정
          </button>
          <button class="action-btn action-btn--primary" @click="showSendModal = true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
            검토 요청 전송
          </button>
          <button class="action-btn action-btn--ghost" @click="selectedIds.clear()">선택 해제</button>
        </div>
      </div>
    </Transition>

    <!-- 특허 목록 테이블 -->
    <div class="table-card">
      <!-- 테이블 헤더 -->
      <div class="table-toolbar">
        <label class="checkbox-all">
          <input
            type="checkbox"
            :checked="allChecked"
            :indeterminate="someChecked"
            @change="toggleAll"
          />
          <span class="checkbox-all__label">전체 선택</span>
        </label>
        <p class="table-toolbar__total">총 <strong>{{ totalItems }}</strong>건</p>
      </div>

      <!-- 열 헤더 -->
      <div class="col-header">
        <div class="col-header__check" />
        <div class="col-header__cell">특허명</div>
        <div class="col-header__cell col-header__appnum">출원번호</div>
        <div class="col-header__cell">기술 분야</div>
        <div class="col-header__cell">담당 사업부</div>
        <div class="col-header__cell col-header__decision">결정</div>
        <div />
      </div>

      <!-- 로딩 스켈레톤 -->
      <div v-if="loading" class="skel-rows">
        <div class="skel-row" v-for="n in 8" :key="n" />
      </div>

      <!-- 빈 상태 -->
      <div v-else-if="!items.length" class="empty-state">
        <div class="empty-state__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p>해당 상태의 특허가 없습니다.</p>
      </div>

      <!-- 목록 -->
      <div v-else class="reeval-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="reeval-item"
          :class="{ 'reeval-item--selected': selectedIds.has(item.id) }"
        >
          <!-- 체크박스 -->
          <label class="item-check" @click.stop>
            <input
              type="checkbox"
              :checked="selectedIds.has(item.id)"
              @change="toggleItem(item.id)"
            />
          </label>

          <!-- 특허 정보 (클릭 → 상세) -->
          <div class="item-main" @click="goDetail(item)">
            <div class="item-main__top">
              <span
                class="item-status-badge"
                :class="item.reviewStatus === 'done' && !item.checked
                  ? 'item-status--unread'
                  : `item-status--${item.reviewStatus}`"
              >
                <span class="item-status-dot" />
                {{ item.reviewStatus === 'done' && !item.checked ? '미확인' : reviewStatusLabel(item.reviewStatus) }}
              </span>

              <h4 class="item-title">{{ item.title }}</h4>
            </div>
            <p v-if="item.summary" class="item-summary">{{ item.summary }}</p>
          </div>

          <!-- 출원번호 -->
          <div class="item-appnum" @click="goDetail(item.id)">
            {{ item.applicationNumber }}
          </div>

          <!-- 기술 분야 -->
          <div class="item-field" @click="goDetail(item.id)">
            <span v-if="item.techField" class="field-tag">{{ item.techField }}</span>
            <span v-else class="text-muted">—</span>
          </div>

          <!-- 담당 사업부 -->
          <div class="item-dept" @click.stop>
            <div v-if="item.departmentId" class="dept-chip">
              <span class="dept-chip__dot" />
              {{ item.departmentName ?? deptName(item.departmentId) }}
              <button class="dept-chip__change" @click="openAssign(item)" title="변경">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <button v-else class="btn-assign-sm" @click="openAssign(item)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              배정
            </button>
          </div>

          <!-- 결정 결과 (회신 완료인 경우) -->
          <div class="item-decision">
            <span v-if="item.decision" class="decision-badge" :class="`decision-badge--${item.decision.toLowerCase()}`">
              {{ decisionLabel(item.decision) }}
            </span>
            <span v-else-if="item.reviewStatus === 'unassigned'" class="text-muted">—</span>
            <span v-else class="decision-pending">미회신</span>
          </div>

          <!-- 화살표 -->
          <button class="item-arrow" @click="goDetail(item.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="table-footer">
        <BasePagination :page="page" :total-pages="totalPages" :total-items="totalItems" @update:page="fetchList" />
      </div>
    </div>

    <!-- ── 사업부 배정 모달 ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">
                {{ bulkAssignMode ? `${selectedIds.size}건 일괄 배정` : '사업부 배정' }}
              </h3>
              <button class="modal__close" @click="showAssignModal = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body">
              <p v-if="!bulkAssignMode" class="modal__patent-name">{{ assignTarget?.title }}</p>
              <div class="dept-search-wrap">
                <svg class="dept-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  v-model="deptSearch"
                  type="text"
                  class="dept-search-input"
                  placeholder="사업부 검색"
                  autocomplete="off"
                />
              </div>
              <div class="dept-select-list">
                <template v-if="filteredDepartments.length">
                  <label
                    v-for="d in filteredDepartments"
                    :key="d.id"
                    class="dept-option"
                    :class="{ 'dept-option--selected': assignDeptId === d.id }"
                  >
                    <input type="radio" :value="d.id" v-model="assignDeptId" />
                    <span class="dept-option__dot" />
                    <span class="dept-option__name">{{ d.name }}</span>
                  </label>
                </template>
                <p v-else class="dept-no-result">검색 결과가 없습니다</p>
              </div>
            </div>
            <div class="modal__footer">
              <button class="btn-cancel" @click="showAssignModal = false">취소</button>
              <button class="btn-confirm" :disabled="!assignDeptId || assignLoading" @click="handleAssign">
                <span v-if="assignLoading" class="spinner" />
                배정 완료
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── 검토 요청 전송 모달 ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSendModal" class="modal-overlay" @click.self="showSendModal = false; sendSuccess = false">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">{{ sendSuccess ? '전송 완료' : '검토 요청 전송' }}</h3>
              <button class="modal__close" @click="showSendModal = false; sendSuccess = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <!-- 전송 완료 상태 -->
            <template v-if="sendSuccess">
              <div class="modal__body send-success">
                <div class="send-success__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <p class="send-success__title">검토 요청이 전송되었습니다</p>
                <p class="send-success__desc">{{ sentCount }}개 사업부에 요청이 전달되었습니다.</p>
              </div>
              <div class="modal__footer">
                <button class="btn-confirm" @click="showSendModal = false; sendSuccess = false">확인</button>
              </div>
            </template>

            <!-- 전송 전 상태 -->
            <template v-else>
              <div class="modal__body">
                <div class="send-summary">
                  <div class="send-summary__row">
                    <span>전송 대상</span>
                    <strong>{{ sendableCount }}건</strong>
                  </div>
                  <div class="send-summary__divider" />
                  <div
                    v-for="row in deptBreakdown"
                    :key="row.deptId"
                    class="send-summary__row send-summary__row--dept"
                  >
                    <span class="send-summary__dept-dot" />
                    <span>{{ row.deptName }}</span>
                    <strong>{{ row.count }}건</strong>
                  </div>
                  <div class="send-summary__row send-summary__row--warn" v-if="unassignedCount > 0">
                    <span>⚠️ 미배정 (제외)</span>
                    <strong>{{ unassignedCount }}건</strong>
                  </div>
                  <div class="send-summary__row send-summary__row--warn" v-if="alreadyRequestedCount > 0">
                    <span>⚠️ 요청 완료·회신 완료 (제외)</span>
                    <strong>{{ alreadyRequestedCount }}건</strong>
                  </div>
                </div>
                <p class="send-note">배정된 사업부에 검토 요청이 전달됩니다. 전송 후 취소할 수 없습니다.</p>
              </div>
              <div class="modal__footer">
                <button class="btn-cancel" @click="showSendModal = false">취소</button>
                <button class="btn-confirm" :disabled="sending || sendableCount === 0" @click="handleSend">
                  <span v-if="sending" class="spinner" />
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                  </svg>
                  전송
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── 기한 변경 모달 ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDueDateModal" class="modal-overlay" @click.self="showDueDateModal = false">
          <div class="modal">
            <div class="modal__header">
              <h3 class="modal__title">재평가 기한 변경</h3>
              <button class="modal__close" @click="showDueDateModal = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body">
              <p class="due-date-desc">변경된 기한은 이전에 전송된 요청을 포함한 모든 보고서 제출 기한에 적용됩니다.</p>
              <div class="due-date-field">
                <label class="due-date-field__label">새 기한</label>
                <input
                  type="date"
                  class="due-date-input"
                  v-model="newDueDate"
                  :min="today"
                />
              </div>
            </div>
            <div class="modal__footer">
              <button class="btn-cancel" @click="showDueDateModal = false">취소</button>
              <button class="btn-confirm" :disabled="!newDueDate" @click="handleDueDateChange">적용</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { reviewsApi } from '@/api/reviews'
import { reviewCyclesApi, type ReviewCycleResponse } from '@/api/reviewCycles'
import type { ReviewTargetParams } from '@/api/reviews'
import { usePagination } from '@/composables/usePagination'
import { useReadReplies } from '@/composables/useReadReplies'
import BasePagination from '@/components/ui/BasePagination.vue'
import type { Department } from '@/types'

const router = useRouter()
const route  = useRoute()
const { readIds, markRead } = useReadReplies()
const { page, totalPages, totalItems, query: pageQuery, setPage, setTotal } = usePagination()

// ── 상태 ────────────────────────────────────────────
const mockPatents: any[] = [] // TODO: 백엔드 미확정, API 연동 후 교체
const currentCycle = ref<ReviewCycleResponse | null>(null)
const loading  = ref(false)
const sending     = ref(false)
const sendSuccess = ref(false)
const sentCount   = ref(0)
const items    = ref<ReevalItem[]>([])
const selectedIds = reactive(new Set<number>())
const activeStatus   = ref('all')
const activeDept     = ref<number | null>(null)
const activeDecision = ref<string | null>(null)

const decisionOpts = [
  { label: '전체',   value: null },
  { label: '유지',   value: 'MAINTAIN' },
  { label: '포기',   value: 'ABANDON' },
]
const showAssignModal  = ref(false)
const showSendModal    = ref(false)
const showDueDateModal = ref(false)
const globalDueDate    = ref('')
const newDueDate       = ref('')
const today            = new Date().toISOString().slice(0, 10)
const assignTarget    = ref<ReevalItem | null>(null)
const assignDeptId    = ref<number | null>(null)
const assignLoading   = ref(false)
const bulkAssignMode  = ref(false)
const deptSearch      = ref('')

const filteredDepartments = computed(() => {
  const q = deptSearch.value.trim().toLowerCase()
  return q ? sortedDepartments.value.filter(d => d.name.toLowerCase().includes(q)) : sortedDepartments.value
})

// TODO: AI 서버 연동 후 교체 필요 — GET /departments API 구현 시 아래 하드코딩 제거
const departments = ref<Department[]>([
  { id: 2,  name: '반도체 사업부' },
  { id: 3,  name: '배터리 사업부' },
  { id: 4,  name: 'AI 사업부' },
  { id: 5,  name: '소재 사업부' },
  { id: 6,  name: '디스플레이 사업부' },
  { id: 7,  name: '전장 사업부' },
  { id: 8,  name: '에너지 사업부' },
  { id: 9,  name: '바이오 사업부' },
  { id: 10, name: '로봇 사업부' },
  { id: 11, name: '통신 사업부' },
  { id: 12, name: '화학 사업부' },
  { id: 13, name: '의료기기 사업부' },
])

const sortedDepartments = computed(() =>
  [...departments.value].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
)

// ── 타입 ────────────────────────────────────────────
interface ReevalItem {
  id: number
  reviewId: number
  checked: boolean
  title: string
  applicationNumber: string
  techField?: string
  summary?: string
  departmentId?: number
  departmentName?: string
  decision?: string | null
  reviewStatus: 'unassigned' | 'requested' | 'overdue' | 'done'
  isOverdue?: boolean
  dueDate?: string
}

// ── 분기 레이블 ──────────────────────────────────────
const quarterLabel = computed(() => {
  const rc = currentCycle.value
  if (rc) return `${rc.year}년 ${rc.quarter}분기`
  const d = new Date()
  return `${d.getFullYear()}년 ${Math.ceil((d.getMonth() + 1) / 3)}분기`
})

// ── 상태 탭 ──────────────────────────────────────────
const statusCounts = ref({ all: 0, unassigned: 0, requested: 0, overdue: 0, done: 0, unread: 0 })

const statusTabs = computed(() => [
  { value: 'all',        label: '전체',       count: statusCounts.value.all,        alert: false },
  { value: 'unread',     label: '미확인 회신', count: statusCounts.value.unread,     alert: statusCounts.value.unread > 0 },
  { value: 'unassigned', label: '요청 전',      count: statusCounts.value.unassigned, alert: false },
  { value: 'requested',  label: '요청 완료',  count: statusCounts.value.requested,  alert: false },
  { value: 'overdue',    label: '지연',       count: statusCounts.value.overdue,    alert: statusCounts.value.overdue > 0 },
  { value: 'done',       label: '회신 완료',  count: statusCounts.value.done,       alert: false },
])

// ── 진행률 ───────────────────────────────────────────
const progressPct = computed(() => {
  const total = statusCounts.value.all
  if (!total) return 0
  return Math.round((statusCounts.value.done / total) * 100)
})

const progressSegments = [
  { label: '요청 전',    color: '#e2e8f0' },
  { label: '요청 완료',  color: '#6366f1' },
  { label: '지연',       color: '#ef4444' },
  { label: '회신 완료',  color: '#22c55e' },
  { label: '미확인 회신', color: '#e29578' },
]

// ── 전체/일부 체크 ───────────────────────────────────
const allChecked  = computed(() => items.value.length > 0 && items.value.every(i => selectedIds.has(i.id)))
const someChecked = computed(() => items.value.some(i => selectedIds.has(i.id)) && !allChecked.value)

function toggleAll(e: Event) {
  if ((e.target as HTMLInputElement).checked) items.value.forEach(i => selectedIds.add(i.id))
  else items.value.forEach(i => selectedIds.delete(i.id))
}
function toggleItem(id: number) {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

// ── 미배정 카운트 ─────────────────────────────────────
const unassignedCount = computed(() =>
  [...selectedIds].filter(id => {
    const item = items.value.find(i => i.id === id)
    return !item?.departmentId
  }).length
)

const alreadyRequestedCount = computed(() =>
  [...selectedIds].filter(id => {
    const item = items.value.find(i => i.id === id)
    return item?.departmentId && ['requested', 'done', 'overdue'].includes(item?.reviewStatus)
  }).length
)

const sendableCount = computed(() =>
  selectedIds.size - unassignedCount.value - alreadyRequestedCount.value
)

// ── 사업부별 배분 ─────────────────────────────────────
const deptBreakdown = computed(() => {
  const map = new Map<number, number>()
  ;[...selectedIds].forEach(id => {
    const item = items.value.find(i => i.id === id)
    if (item?.departmentId && !['requested', 'done', 'overdue'].includes(item?.reviewStatus))
      map.set(item.departmentId, (map.get(item.departmentId) ?? 0) + 1)
  })
  return [...map.entries()]
    .map(([deptId, count]) => ({ deptId, deptName: deptName(deptId), count }))
    .sort((a, b) => a.deptName.localeCompare(b.deptName, 'ko'))
})

// ── 유틸 ────────────────────────────────────────────
function deptName(id?: number) {
  return departments.value.find(d => d.id === id)?.name ?? `사업부 #${id}`
}

function reviewStatusLabel(s: string) {
  return { unassigned: '요청 전', requested: '요청 완료', overdue: '지연', done: '회신 완료' }[s] ?? s
}

function decisionLabel(d: string) {
  return { KEEP: '유지', MAINTAIN: '유지', DISPOSE: '포기', ABANDON: '포기' }[d] ?? d
}

// ── 데이터 로드 ──────────────────────────────────────
const statusToReview: Record<string, string> = {
  unassigned: 'SCHEDULED',
  requested:  'PENDING',
  overdue:    'OVERDUE',
  done:       'SUBMITTED',
}
const reviewToStatus: Record<string, ReevalItem['reviewStatus']> = {
  SCHEDULED: 'unassigned',
  PENDING:   'requested',
  OVERDUE:   'overdue',
  SUBMITTED: 'done',
}

async function fetchStatusCounts(deptId?: number | null) {
  const base: ReviewTargetParams = { page: 1, size: 1 }
  if (deptId != null && deptId !== -1) base.departmentId = deptId
  const [all, scheduled, pending, overdue, done, unread] = await Promise.all([
    reviewsApi.getReviewTargets({ ...base }),
    reviewsApi.getReviewTargets({ ...base, status: 'SCHEDULED' }),
    reviewsApi.getReviewTargets({ ...base, status: 'PENDING' }),
    reviewsApi.getReviewTargets({ ...base, status: 'OVERDUE' }),
    reviewsApi.getReviewTargets({ ...base, status: 'SUBMITTED', checked: true }),
    reviewsApi.getReviewTargets({ ...base, status: 'SUBMITTED', checked: false }),
  ])
  statusCounts.value = {
    all:        all.totalItems,
    unassigned: scheduled.totalItems,
    requested:  pending.totalItems,
    overdue:    overdue.totalItems,
    done:       done.totalItems,
    unread:     unread.totalItems,
  }
}

async function fetchList(p = 1) {
  loading.value = true
  setPage(p)
  selectedIds.clear()
  try {
    const params: ReviewTargetParams = { page: p, size: pageQuery.value.size }
    if (activeStatus.value === 'unread') {
      params.status = 'SUBMITTED'
      params.checked = false
    } else if (activeStatus.value === 'done') {
      params.status = 'SUBMITTED'
      params.checked = true
    } else if (activeStatus.value !== 'all' && statusToReview[activeStatus.value]) {
      params.status = statusToReview[activeStatus.value]
    }
    if (activeDept.value !== null && activeDept.value !== -1) {
      params.departmentId = activeDept.value
    }

    const [res] = await Promise.all([
      reviewsApi.getReviewTargets(params),
      fetchStatusCounts(activeDept.value),
    ])
    items.value = res.items.map(r => ({
      id: r.patentId,
      reviewId: r.id,
      checked: r.checked,
      title: r.title,
      applicationNumber: r.applicationNumber,
      techField: r.techField,
      departmentId: r.departmentId,
      departmentName: r.departmentName,
      decision: r.opinion ?? null,
      reviewStatus: reviewToStatus[r.status] ?? 'unassigned',
      isOverdue: r.status === 'OVERDUE',
    }))
    setTotal(res.totalItems, res.totalPages)

    const cur = activeStatus.value
    statusCounts.value = {
      all:        cur === 'all'        ? res.totalItems : statusCounts.value.all,
      unassigned: cur === 'unassigned' ? res.totalItems : statusCounts.value.unassigned,
      requested:  cur === 'requested'  ? res.totalItems : statusCounts.value.requested,
      overdue:    cur === 'overdue'    ? res.totalItems : statusCounts.value.overdue,
      done:       cur === 'done'       ? res.totalItems : statusCounts.value.done,
      unread:     cur === 'unread' ? res.totalItems : statusCounts.value.unread,
    }
  } catch (err) {
    console.error('목록 조회 오류:', err)
  } finally {
    loading.value = false
  }
}

// ── 배정 ────────────────────────────────────────────
function openAssign(item: ReevalItem) {
  assignTarget.value = item
  assignDeptId.value = item.departmentId ?? null
  bulkAssignMode.value = false
  deptSearch.value = ''
  showAssignModal.value = true
}

function openBulkAssign() {
  assignTarget.value = null
  assignDeptId.value = null
  bulkAssignMode.value = true
  deptSearch.value = ''
  showAssignModal.value = true
}

async function handleAssign() {
  if (!assignDeptId.value) return
  assignLoading.value = true
  try {
    // TODO: 확인 필요 - assignDepartment 제거됨, 대체 API 연결 필요
    if (bulkAssignMode.value) {
      // await Promise.all([...selectedIds].map(id => patentsApi.assignDepartment(id, assignDeptId.value!)))
    } else if (assignTarget.value) {
      // await patentsApi.assignDepartment(assignTarget.value.id, assignDeptId.value)
    }
  } catch (err) {
    console.error('ReevaluationView/handleAssign:', err)
  } finally {
    assignLoading.value = false
    showAssignModal.value = false
    const preserved = new Set(selectedIds)
    await fetchList(page.value)
    preserved.forEach(id => selectedIds.add(id))
  }
}

// ── 검토 요청 전송 ───────────────────────────────────
async function handleSend() {
  sending.value = true
  try {
    const sendablePatentIds = [...selectedIds]
      .map(id => items.value.find(i => i.id === id))
      .filter(i => i?.departmentId && !['requested', 'done', 'overdue'].includes(i?.reviewStatus ?? ''))
      .map(i => i!.id)

    await reviewsApi.requestBulkReview(sendablePatentIds)
  } catch (e) {
    console.error('ReevaluationView/handleSend:', e)
  } finally {
    sending.value = false
    sentCount.value = sendableCount.value
    sendSuccess.value = true
    selectedIds.clear()
    await fetchList(page.value)
  }
}

function openDueDateModal() {
  newDueDate.value = globalDueDate.value
  showDueDateModal.value = true
}

function handleDueDateChange() {
  if (!newDueDate.value) return
  globalDueDate.value = newDueDate.value
  showDueDateModal.value = false
}

function goDetail(item: ReevalItem) {
  markRead(item.id)
  reviewsApi.confirmReview(item.reviewId).then(() => {
    const target = items.value.find(i => i.id === item.id)
    if (target) target.checked = true
    if (activeStatus.value === 'unread') {
      items.value = items.value.filter(i => i.id !== item.id)
      statusCounts.value = {
        ...statusCounts.value,
        unread: Math.max(0, statusCounts.value.unread - 1),
      }
    }
  }).catch(() => { /* 확인 실패 시 무시 */ })
  router.push(`/legal/patents/${item.id}`)
}

watch([activeStatus, activeDept, activeDecision], ([tab, dept, decision]) => {
  const query: Record<string, string> = {}
  if (tab && tab !== 'all') query.tab = tab
  if (dept !== null) query.dept = String(dept)
  if (decision !== null) query.decision = decision
  router.replace({ query })
})

onMounted(async () => {
  const tab      = route.query.tab      as string | undefined
  const dept     = route.query.dept     as string | undefined
  const decision = route.query.decision as string | undefined
  const open     = route.query.open     as string | undefined
  if (tab)      activeStatus.value   = tab
  if (dept)     activeDept.value     = Number(dept)
  if (decision) activeDecision.value = decision

  try {
    currentCycle.value = await reviewCyclesApi.getCurrent()
    if (currentCycle.value.deadline) globalDueDate.value = currentCycle.value.deadline
  } catch {
    // 폴백: 하드코딩 없이 빈 값 유지
  }

  await fetchList(1)
  if (open) {
    await router.replace({ path: '/legal/reevaluation', query: tab ? { tab } : {} })
    const openItem = items.value.find(i => i.id === Number(open))
    if (openItem) goDetail(openItem)
    else router.push(`/legal/patents/${open}`)
  }
})
</script>

<style scoped>
.reeval-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
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

.deadline-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  white-space: nowrap;
}

.deadline-icon { color: var(--color-text-muted); flex-shrink: 0; }

.deadline-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.deadline-date {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.btn-change-deadline {
  padding: 4px 12px;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-primary-dark);
  cursor: pointer;
  transition: background .13s;
  margin-left: 2px;
}
.btn-change-deadline:hover { background: var(--color-primary-border); }

.due-date-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
  background: var(--color-surface-muted);
  padding: 10px 14px;
  border-radius: 8px;
}

.due-date-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.due-date-field__label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.due-date-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  box-sizing: border-box;
  transition: border-color .13s;
}
.due-date-input:focus { border-color: var(--color-primary); }

/* ── 진행률 바 카드 ──────────────────────────────── */
.progress-bar-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-bar-card__quarter {
  margin: 0 0 12px;
  padding-bottom: 12px;
  font-size: 18px; font-weight: 800;
  color: var(--color-text); letter-spacing: -0.02em;
  border-bottom: 1.5px solid var(--color-border);
  width: 100%;
}

.progress-bar-card__top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar-card__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-bar-card__label { font-size: 13.5px; font-weight: 500; color: var(--color-text-secondary); }
.progress-bar-card__label strong { color: var(--color-text); font-weight: 700; }
.progress-bar-card__done  { color: var(--color-primary) !important; }
.progress-bar-card__pct   { font-size: 15px; font-weight: 800; color: var(--color-primary); }

.progress-track {
  height: 8px;
  background: var(--color-surface-muted);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary-dark), var(--c-primary-400));
  border-radius: 4px;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

.progress-bar-card__legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── 필터 탭 ─────────────────────────────────────── */
.sub-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  flex-wrap: wrap;
}
.sub-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.sub-filter-group__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-right: 2px;
  white-space: nowrap;
}
.sub-filter-select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 4px 28px 4px 10px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  background: var(--color-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: border-color 0.12s;
  min-width: 120px;
}
.sub-filter-select:focus { border-color: var(--color-primary); }

.sub-filter-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 3px 12px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.12s;
}
.sub-filter-btn:hover { background: var(--color-surface-muted); }
.sub-filter-btn--active {
  background: var(--color-primary-bg);
  border-color: var(--color-primary-border);
  color: var(--color-primary-dark);
  font-weight: 600;
}
.sub-filter-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  flex-shrink: 0;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1.5px solid var(--color-border);
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  color: var(--color-text-muted);
  white-space: nowrap;
  position: relative;
  transition: color .13s;
}
.filter-tab:hover { color: var(--color-text); }
.filter-tab--active {
  color: var(--color-primary-dark);
  font-weight: 700;
}
.filter-tab--active::after {
  content: '';
  position: absolute;
  bottom: -1.5px; left: 0; right: 0;
  height: 2px;
  background: var(--color-primary-dark);
  border-radius: 2px 2px 0 0;
}

.filter-tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}
.filter-tab__badge--red {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* ── 액션 바 ─────────────────────────────────────── */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-primary-bg);
  border: 1px solid var(--c-primary-200);
  border-radius: 10px;
  flex-wrap: wrap;
}

.action-bar__count {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-primary-darker);
}

.action-bar__btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--color-surface);
  border: 1px solid var(--c-primary-200);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-primary-darker);
  cursor: pointer;
  transition: background .13s;
}
.action-btn:hover { background: var(--c-primary-50); }
.action-btn--primary {
  background: var(--color-primary-dark);
  color: var(--color-surface);
  border-color: var(--color-primary-dark);
}
.action-btn--primary:hover { background: var(--color-primary-darker); }
.action-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--color-primary);
}
.action-btn--ghost:hover { background: var(--c-primary-50); }

/* ── 테이블 카드 ─────────────────────────────────── */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-muted);
}

.checkbox-all {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-all input {
  width: 15px; height: 15px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-all__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.table-toolbar__total {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}
.table-toolbar__total strong { color: var(--color-text); }

/* ── 열 헤더 ─────────────────────────────────────── */
.col-header {
  display: grid;
  grid-template-columns: 36px 1fr 150px 140px 180px 72px 36px;
  gap: 20px;
  padding: 8px 20px;
  border-bottom: 1.5px solid var(--color-border);
  background: var(--color-surface-muted);
}

.col-header__check { width: 36px; }

.col-header__cell {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.col-header__appnum { padding-left: 28px; }
.col-header__decision { text-align: center; }

/* ── 재평가 목록 아이템 ───────────────────────────── */
.reeval-list { display: flex; flex-direction: column; }

.reeval-item {
  display: grid;
  grid-template-columns: 36px 1fr 150px 140px 180px 72px 36px;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-surface-hover);
  transition: background .12s;
}
.reeval-item:last-child { border-bottom: none; }
.reeval-item:hover { background: var(--color-surface-hover); }
.reeval-item--selected { background: var(--color-surface-soft); }

.item-check {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.item-check input {
  width: 15px; height: 15px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  min-width: 0;
}

.item-main__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 검토 상태 배지 */
.item-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11.5px;
  font-weight: 600;
  flex-shrink: 0;
}
.item-status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.item-status--unassigned { background: var(--color-surface-muted); color: var(--color-text-muted); }
.item-status--requested  { background: var(--color-primary-bg); color: var(--color-primary-darker); }

.item-status--overdue    { background: var(--color-danger-bg); color: var(--color-danger); }
.item-status--done       { background: var(--color-success-bg); color: var(--color-success-dark); }
.item-status--unread     { background: #fff3e0; color: #e65100; }

.item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-summary {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-appnum {
  cursor: pointer;
  min-width: 0;
  padding-left: 28px;
}

.item-field {
  cursor: pointer;
}

.mono {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
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

/* 담당 사업부 셀 */
.item-dept {
  display: flex;
  align-items: center;
}

.dept-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.dept-chip__dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.dept-chip__change {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  display: flex;
  padding: 0;
  margin-left: 2px;
  transition: color .13s;
}
.dept-chip__change:hover { color: var(--color-primary); }

.btn-assign-sm {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: var(--color-primary-bg);
  border: 1px dashed var(--c-primary-200);
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-primary);
  cursor: pointer;
  transition: background .13s;
}
.btn-assign-sm:hover { background: var(--color-primary-border); }

/* 결정 배지 */
.item-decision { display: flex; align-items: center; justify-content: center; }

.decision-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.decision-badge--keep     { background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-badge--maintain { background: var(--color-success-bg); color: var(--color-success-dark); }
.decision-badge--sell     { background: var(--color-primary-bg); color: var(--color-primary-darker); }
.decision-badge--dispose  { background: var(--color-danger-bg); color: var(--color-danger); }
.decision-badge--abandon  { background: var(--color-danger-bg); color: var(--color-danger); }

.decision-pending { font-size: 12.5px; color: var(--c-slate-300); }

.item-arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-slate-300);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color .12s, background .12s;
}
.item-arrow:hover { color: var(--color-primary); background: var(--c-primary-50); }

/* ── 스켈레톤 ────────────────────────────────────── */
.skel-rows { display: flex; flex-direction: column; }
.skel-row {
  height: 60px;
  border-bottom: 1px solid var(--color-surface-hover);
  background: linear-gradient(90deg, var(--color-surface-hover) 25%, var(--color-surface-muted) 50%, var(--color-surface-hover) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 빈 상태 ─────────────────────────────────────── */
.empty-state {
  padding: 56px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--color-text-subtle);
}
.empty-state__icon {
  width: 52px; height: 52px;
  background: var(--color-surface-muted);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.empty-state p { font-size: 13.5px; }

/* ── 테이블 푸터 ─────────────────────────────────── */
.table-footer {
  display: flex;
  justify-content: center;
  padding: 16px;
  border-top: 1px solid var(--color-surface-muted);
}

/* ── 모달 ────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(2px);
}
.modal {
  background: var(--color-surface); border-radius: 18px;
  width: min(480px, 94vw);
  box-shadow: 0 24px 64px rgba(15,23,42,.18);
  overflow: hidden;
}
.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--color-surface-muted);
}
.modal__title { font-size: 17px; font-weight: 700; color: var(--color-text); margin: 0; }
.modal__close {
  width: 32px; height: 32px;
  background: var(--color-surface-muted); border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);
}
.modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal__patent-name { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin: 0; line-height: 1.4; }
.modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px 20px; border-top: 1px solid var(--color-surface-muted);
}

.dept-search-wrap {
  position: relative;
  margin-bottom: 10px;
}
.dept-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}
.dept-search-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  font-size: 13.5px;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  box-sizing: border-box;
  transition: border-color .13s;
}
.dept-search-input:focus { border-color: var(--color-primary); }
.dept-search-input::placeholder { color: var(--color-text-subtle); }

.dept-select-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 2px;
}
.dept-select-list::-webkit-scrollbar { width: 4px; }
.dept-select-list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

.dept-option {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background .1s, border-color .1s;
}
.dept-option:hover { background: var(--color-surface-hover); }
.dept-option input { display: none; }
.dept-option--selected { border-color: var(--color-primary); background: var(--color-surface-soft); }
.dept-option__dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: 2px solid var(--c-slate-300);
  flex-shrink: 0;
  transition: border-color .13s, background .13s;
}
.dept-option--selected .dept-option__dot { background: var(--color-primary); border-color: var(--color-primary); }
.dept-option__name { font-size: 13.5px; font-weight: 500; color: var(--color-text); }

.dept-no-result {
  font-size: 13px;
  color: var(--color-text-subtle);
  text-align: center;
  padding: 20px 0;
  margin: 0;
}

.send-summary {
  background: var(--color-surface-hover);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.send-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}
.send-summary__row--dept {
  gap: 8px;
  justify-content: flex-start;
  color: var(--color-text);
}
.send-summary__row--dept strong {
  margin-left: auto;
  color: var(--color-text-secondary);
}
.send-summary__dept-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}
.send-summary__divider {
  height: 1px;
  background: var(--color-border);
  margin: 2px 0;
}
.send-summary__row--warn { color: var(--color-danger); }
.send-summary__row--warn strong { color: var(--color-danger); }
.send-note { font-size: 12.5px; color: var(--color-text-subtle); margin: 0; line-height: 1.6; }

.send-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 24px;
  text-align: center;
}
.send-success__icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-success-bg);
  color: var(--color-success-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.send-success__title { font-size: 16px; font-weight: 700; color: var(--color-text); margin: 0; }
.send-success__desc  { font-size: 13.5px; color: var(--color-text-muted); margin: 0; }

.btn-cancel {
  padding: 9px 20px; background: var(--color-surface-muted); border: 1px solid var(--color-border); border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--c-slate-600);
}
.btn-confirm {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
  color: var(--color-surface); border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,70,229,.3);
}
.btn-confirm:disabled { opacity: .6; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: var(--color-surface);
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 전환 */
.slide-down-enter-active { transition: max-height .25s ease, opacity .2s; max-height: 100px; }
.slide-down-leave-active { transition: max-height .2s ease, opacity .15s; }
.slide-down-enter-from, .slide-down-leave-to { max-height: 0; opacity: 0; overflow: hidden; }

.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { animation: modalUp .22s cubic-bezier(.34,1.56,.64,1); }
@keyframes modalUp { from { transform: translateY(12px) scale(.98); } to { transform: translateY(0) scale(1); } }
</style>
