<template>
  <div class="detail-page">

    <!-- 로딩 -->
    <div v-if="loading" class="detail-skeleton">
      <div class="skel skel--title" />
      <div class="skel skel--sub" />
      <div class="skel skel--tabs" />
      <div class="skel skel--body" />
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="detail-error">
      <p>특허 정보를 불러오지 못했습니다.</p>
      <button @click="load">다시 시도</button>
    </div>

    <template v-else-if="patent">

      <!-- ── 상단 헤더 ── -->
      <div class="detail-header">
        <div class="detail-header__top">
          <button class="back-btn" @click="$router.back()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            목록으로
          </button>
          <div class="detail-header__actions">
            <!-- Legal만 수정/삭제 -->
            <template v-if="isLegal">
              <button class="hdr-btn" @click="showEditModal = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                수정
              </button>
              <button class="hdr-btn hdr-btn--danger" @click="showDeleteConfirm = true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                삭제
              </button>
            </template>
          </div>
        </div>

        <div class="detail-header__main">
          <div class="detail-header__title-row">
            <PatentStatusBadge :status="patentStatus" />
            <h1 class="detail-title">{{ patent.title }}</h1>
          </div>

          <!-- 핵심 메타 -->
          <div class="detail-meta-chips">
            <span class="meta-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              출원 {{ formatDate(patent.applicationDate) }}
            </span>
            <span class="meta-chip" v-if="patent.expiryDate" :class="expiryChipClass">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              만료 {{ formatDate(patent.expiryDate) }}
            </span>
            <span class="meta-chip" v-if="patent.filingCountry">
              🌏 {{ patent.filingCountry }}
            </span>
            <span class="meta-chip" v-if="patent.citationCount != null">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              피인용 {{ patent.citationCount }}회
            </span>
          </div>
        </div>
      </div>

      <!-- ── 본문 레이아웃 ── -->
      <div class="detail-body">

        <!-- 좌: 탭 콘텐츠 -->
        <div class="detail-main">

          <!-- 탭 -->
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab"
              :class="{ 'tab--active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content">

            <!-- ── 특허 원문 탭 ── -->
            <template v-if="activeTab === 'info'">
              <div class="info-section">
                <h3 class="info-section__title">기본 정보</h3>
                <div class="info-grid">
                  <div class="info-item" v-for="item in basicInfoItems" :key="item.label">
                    <p class="info-item__label">{{ item.label }}</p>
                    <p class="info-item__value" :class="{ mono: item.mono }">{{ item.value || '—' }}</p>
                  </div>
                </div>
              </div>

              <div class="info-section" v-if="patent.overview">
                <h3 class="info-section__title">개요</h3>
                <p class="info-text">{{ patent.overview }}</p>
              </div>

              <div class="info-section" v-if="patent.coreContent">
                <h3 class="info-section__title">핵심 내용</h3>
                <p class="info-text">{{ patent.coreContent }}</p>
              </div>

              <div class="info-section" v-if="patent.keywords?.length">
                <h3 class="info-section__title">키워드</h3>
                <div class="keyword-chips">
                  <span v-for="kw in patent.keywords" :key="kw" class="kw-chip"># {{ kw }}</span>
                </div>
              </div>

              <!-- PDF 원문 링크 -->
              <div v-if="patent.originalPdfKey" class="pdf-row">
                <div class="pdf-row__left">
                  <div class="pdf-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <p class="pdf-row__name">특허 원문 PDF</p>
                    <p class="pdf-row__key">{{ patent.originalPdfKey }}</p>
                  </div>
                </div>
                <button class="btn-download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  다운로드
                </button>
              </div>
            </template>

            <!-- ── AI 평가 보고서 탭 ── -->
            <template v-if="activeTab === 'report'">
              <AiReportPanel :patent-id="patentId" />
            </template>

            <!-- ── 연차료 탭 ── -->
            <template v-if="activeTab === 'annuity'">
              <div class="annuity-section">
                <div class="annuity-header">
                  <h3 class="info-section__title" style="margin:0">연차료 납부 이력</h3>
                  <button v-if="isLegal" class="btn-sm" @click="showAnnuityForm = !showAnnuityForm">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    이력 추가
                  </button>
                </div>

                <!-- 추가 폼 -->
                <Transition name="slide-down">
                  <div v-if="showAnnuityForm" class="annuity-form">
                    <div class="annuity-form__grid">
                      <div class="field">
                        <label class="field__label">납부 연차</label>
                        <input v-model.number="annuityForm.annuityYear" type="number" class="field__input" min="1" />
                      </div>
                      <div class="field">
                        <label class="field__label">납부 기한</label>
                        <input v-model="annuityForm.dueDate" type="date" class="field__input" />
                      </div>
                      <div class="field">
                        <label class="field__label">납부 금액 (원)</label>
                        <input v-model.number="annuityForm.amount" type="number" class="field__input" />
                      </div>
                      <div class="field">
                        <label class="field__label">상태</label>
                        <select v-model="annuityForm.status" class="field__input">
                          <option value="UNPAID">미납</option>
                          <option value="PAID">납부 완료</option>
                        </select>
                      </div>
                    </div>
                    <div class="annuity-form__actions">
                      <button class="btn-cancel-sm" @click="showAnnuityForm = false">취소</button>
                      <button class="btn-confirm-sm" @click="submitAnnuity">추가</button>
                    </div>
                  </div>
                </Transition>

                <!-- 이력 테이블 -->
                <div v-if="annuities.length" class="annuity-table-wrap">
                  <table class="annuity-table">
                    <thead>
                      <tr>
                        <th>연차</th>
                        <th>납부 기한</th>
                        <th>납부일</th>
                        <th>금액</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="a in annuities" :key="a.id">
                        <td>{{ a.annuityYear }}년차</td>
                        <td>{{ formatDate(a.dueDate) }}</td>
                        <td>{{ a.paidDate ? formatDate(a.paidDate) : '—' }}</td>
                        <td>{{ a.amount.toLocaleString() }}원</td>
                        <td>
                          <span class="annuity-status" :class="a.status === 'PAID' ? 'annuity-status--paid' : 'annuity-status--unpaid'">
                            {{ a.status === 'PAID' ? '납부 완료' : '미납' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="empty-mini">연차료 이력이 없습니다.</div>
              </div>
            </template>

            <!-- ── 권리 상태 이력 탭 ── -->
            <template v-if="activeTab === 'status'">
              <div class="status-timeline">
                <div v-if="legalStatuses.length" class="timeline">
                  <div v-for="(s, i) in legalStatuses" :key="s.id" class="timeline-item">
                    <div class="timeline-item__dot" :class="`tl-dot--${statusVariant(s.status)}`" />
                    <div v-if="i < legalStatuses.length - 1" class="timeline-item__line" />
                    <div class="timeline-item__content">
                      <PatentStatusBadge :status="s.status" />
                      <p class="timeline-item__date">{{ formatDate(s.changedAt) }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-mini">권리 상태 이력이 없습니다.</div>
              </div>
            </template>

          </div>
        </div>

        <!-- 우: 사이드 패널 -->
        <aside class="detail-aside">

          <!-- 사업부 정보 (Legal만) -->
          <div v-if="isLegal" class="aside-card">
            <p class="aside-card__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              담당 사업부
            </p>
            <div v-if="assignedDept" class="dept-info">
              <div class="dept-info__dot" />
              <span>{{ assignedDept }}</span>
            </div>
            <p v-else class="aside-empty">미배정</p>
            <button v-if="isLegal" class="aside-btn" @click="showAssignModal = true">
              {{ assignedDept ? '배정 변경' : '사업부 배정' }}
            </button>
          </div>

          <!-- 유지/포기 결정 제출 (사업부) -->
          <div v-if="isBusiness && currentDecision" class="aside-card aside-card--decision">
            <p class="aside-card__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              유지/포기 의견 제출
            </p>

            <!-- 이미 제출한 경우 -->
            <div v-if="currentDecision.decision" class="decision-done">
              <div class="decision-done__badge" :class="`decision-done__badge--${currentDecision.decision.toLowerCase()}`">
                {{ decisionLabel(currentDecision.decision) }}
              </div>
              <p class="decision-done__date">{{ formatDate(currentDecision.decidedAt) }} 제출</p>
              <p v-if="currentDecision.comment" class="decision-done__comment">{{ currentDecision.comment }}</p>
            </div>

            <!-- 미제출 -->
            <div v-else class="decision-form">
              <div class="decision-btns">
                <button
                  v-for="opt in decisionOptions"
                  :key="opt.value"
                  class="decision-btn"
                  :class="[`decision-btn--${opt.value.toLowerCase()}`, { 'decision-btn--selected': decisionForm.decision === opt.value }]"
                  @click="decisionForm.decision = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <textarea
                v-model="decisionForm.comment"
                class="decision-textarea"
                placeholder="의견을 입력하세요 (선택)"
                rows="3"
              />
              <button
                class="btn-submit-decision"
                :disabled="!decisionForm.decision || decisionSubmitting"
                @click="submitDecision"
              >
                <span v-if="decisionSubmitting" class="spinner-sm" />
                의견 제출
              </button>
            </div>
          </div>

          <!-- 특허 기본 정보 요약 -->
          <div class="aside-card">
            <p class="aside-card__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              특허 정보
            </p>
            <div class="aside-info-list">
              <div class="aside-info-item" v-for="item in asideInfoItems" :key="item.label">
                <span class="aside-info-item__label">{{ item.label }}</span>
                <span class="aside-info-item__value" :class="{ mono: item.mono }">{{ item.value || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- 관련 제품 -->
          <div v-if="patent.relatedProducts?.length" class="aside-card">
            <p class="aside-card__title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              관련 제품
            </p>
            <div class="keyword-chips">
              <span v-for="p in patent.relatedProducts" :key="p" class="kw-chip kw-chip--product">{{ p }}</span>
            </div>
          </div>

        </aside>
      </div>

    </template>

    <!-- 사업부 배정 모달 (Legal) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
          <div class="modal modal--sm">
            <div class="modal__header">
              <h3 class="modal__title">사업부 배정</h3>
              <button class="modal__close" @click="showAssignModal = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="modal__body">
              <p class="modal__label">사업부 선택</p>
              <select v-model="assignDeptId" class="field__input" style="width:100%">
                <option :value="null">선택하세요</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>

              <div style="margin-top: 12px;">
                <p class="modal__label">검토 요청 전송</p>
                <label class="checkbox-row">
                  <input v-model="sendRequestAfterAssign" type="checkbox" />
                  <span>배정 후 바로 검토 요청 전송</span>
                </label>
              </div>
            </div>
            <div class="modal__footer">
              <button class="btn-cancel" @click="showAssignModal = false">취소</button>
              <button class="btn-confirm" :disabled="!assignDeptId || assignLoading" @click="handleAssign">
                <span v-if="assignLoading" class="spinner" />
                배정
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { patentsApi } from '@/api/patents'
import { inboxApi, decisionsApi } from '@/api/misc'
import PatentStatusBadge from '@/components/patent/PatentStatusBadge.vue'
import AiReportPanel from '@/components/report/AiReportPanel.vue'
import type { Patent, Annuity, PatentLegalStatus, Decision, Department } from '@/types'

const props  = defineProps<{ patentId: number }>()
const router = useRouter()
const auth   = useAuthStore()

const isLegal   = computed(() => auth.isLegal || auth.isAdmin)
const isBusiness = computed(() => auth.isBusiness)

// ── 상태 ────────────────────────────────────────────
const loading  = ref(false)
const error    = ref(false)
const patent   = ref<Patent | null>(null)
const annuities     = ref<Annuity[]>([])
const legalStatuses = ref<PatentLegalStatus[]>([])
const currentDecision = ref<Decision | null>(null)
const departments = ref<Department[]>([])
const assignedDept = ref<string>('')

const activeTab = ref<'info' | 'report' | 'annuity' | 'status'>('info')

// 모달
const showAssignModal    = ref(false)
const showEditModal      = ref(false)
const showDeleteConfirm  = ref(false)
const showAnnuityForm    = ref(false)
const assignDeptId       = ref<number | null>(null)
const sendRequestAfterAssign = ref(false)
const assignLoading      = ref(false)

// 연차료 폼
const annuityForm = reactive({ annuityYear: 1, dueDate: '', amount: 0, status: 'UNPAID' as 'PAID' | 'UNPAID', paidDate: null as null | string })

// 결정 폼
const decisionForm = reactive<{ decision: 'KEEP' | 'DISPOSE' | ''; comment: string }>({ decision: '', comment: '' })
const decisionSubmitting = ref(false)

// ── 탭 ─────────────────────────────────────────────
const tabs = [
  { key: 'info',    label: '특허 원문' },
  { key: 'report',  label: 'AI 평가 보고서' },
  { key: 'annuity', label: '연차료 이력' },
  { key: 'status',  label: '권리 상태' },
]

// ── 결정 옵션 ────────────────────────────────────────
const decisionOptions = [
  { value: 'KEEP',    label: '✅ 유지' },
  { value: 'DISPOSE', label: '🗑 포기' },
]

function decisionLabel(d: string) {
  return { KEEP: '유지', DISPOSE: '포기' }[d] ?? d
}

// ── 특허 상태 ────────────────────────────────────────
const patentStatus = computed(() => {
  if (!patent.value?.expiryDate) return 'REGISTERED'
  const diff = (new Date(patent.value.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return 'EXPIRED'
  if (diff < 365) return 'EXPIRING_SOON'
  return 'REGISTERED'
})

const expiryChipClass = computed(() => {
  if (patentStatus.value === 'EXPIRED')       return 'meta-chip--danger'
  if (patentStatus.value === 'EXPIRING_SOON') return 'meta-chip--warn'
  return ''
})

// ── 기본 정보 그리드 ─────────────────────────────────
const basicInfoItems = computed(() => {
  const p = patent.value
  if (!p) return []
  return [
    { label: '출원번호',    value: p.applicationNumber,  mono: true },
    { label: '등록번호',    value: p.registrationNumber, mono: true },
    { label: '관리번호',    value: p.manageNumber,        mono: true },
    { label: '출원일',      value: formatDate(p.applicationDate) },
    { label: '등록일',      value: formatDate(p.registrationDate) },
    { label: '만료 예정일', value: formatDate(p.expiryDate) },
    { label: '출원인',      value: p.applicant },
    { label: '발명자',      value: p.inventor },
    { label: 'IPC 코드',    value: p.ipcCode,  mono: true },
    { label: 'CPC 코드',    value: p.cpcCode,  mono: true },
    { label: '기술 분야',   value: p.techField },
    { label: '사업 분야',   value: p.businessField },
    { label: '출원 국가',   value: p.filingCountry },
    { label: '공동 출원',   value: p.isJointApplication ? (p.jointApplicant ?? '있음') : '없음' },
  ]
})

const asideInfoItems = computed(() => {
  const p = patent.value
  if (!p) return []
  return [
    { label: '출원번호', value: p.applicationNumber, mono: true },
    { label: '출원일',   value: formatDate(p.applicationDate) },
    { label: '만료일',   value: formatDate(p.expiryDate) },
    { label: '발명자',   value: p.inventor },
    { label: '피인용',   value: p.citationCount != null ? `${p.citationCount}회` : '' },
  ]
})

// ── 데이터 로드 ──────────────────────────────────────
async function load() {
  loading.value = true
  error.value = false
  try {
    const [patentRes, annuityRes, statusRes] = await Promise.all([
      patentsApi.get(props.patentId),
      patentsApi.getAnnuities(props.patentId),
      patentsApi.getLegalStatus(props.patentId),
    ])
    patent.value      = patentRes.patent
    annuities.value   = annuityRes.items
    legalStatuses.value = statusRes.items

    // 사업부: inbox에서 내 결정 로드
    if (auth.isBusiness) {
      // inbox 목록에서 이 특허 찾기
      try {
        const inbox = await inboxApi.list()
        const item = inbox.items.find(i => i.patentId === props.patentId)
        if (item) {
          const detail = await inboxApi.get(item.decisionId)
          currentDecision.value = detail.decision
        }
      } catch { /* 없으면 무시 */ }
    }

    // Legal: 담당 사업부 로드
    if (auth.isLegal || auth.isAdmin) {
      try {
        const deptRes = await patentsApi.getDepartments(props.patentId)
        const first = deptRes.items[0]
        if (first) {
          // departments 목록을 별도 API로 가져와야 하지만 이름 저장
          assignedDept.value = `부서 #${first.departmentId}`
        }
      } catch { /* 없으면 미배정 */ }
    }

  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

// ── 연차료 추가 ──────────────────────────────────────
async function submitAnnuity() {
  try {
    await patentsApi.addAnnuity(props.patentId, annuityForm)
    const res = await patentsApi.getAnnuities(props.patentId)
    annuities.value = res.items
    showAnnuityForm.value = false
    Object.assign(annuityForm, { annuityYear: 1, dueDate: '', amount: 0, status: 'UNPAID', paidDate: null })
  } catch (e) { console.error(e) }
}

// ── 결정 제출 ────────────────────────────────────────
async function submitDecision() {
  if (!decisionForm.decision || !currentDecision.value) return
  decisionSubmitting.value = true
  try {
    const res = await inboxApi.decide(currentDecision.value.id, {
      decision: decisionForm.decision,
      comment: decisionForm.comment || undefined,
    })
    currentDecision.value = res.decision
  } catch (e) { console.error(e) }
  finally { decisionSubmitting.value = false }
}

// ── 사업부 배정 ──────────────────────────────────────
async function handleAssign() {
  if (!assignDeptId.value) return
  assignLoading.value = true
  try {
    await patentsApi.assignDepartment(props.patentId, assignDeptId.value)
    if (sendRequestAfterAssign.value) {
      await patentsApi.sendDecisionRequest(props.patentId, assignDeptId.value)
    }
    showAssignModal.value = false
    await load()
  } catch (e) { console.error(e) }
  finally { assignLoading.value = false }
}

// ── 유틸 ────────────────────────────────────────────
function formatDate(d?: string | null) {
  if (!d) return '—'
  return d.slice(0, 10).replace(/-/g, '.')
}

function statusVariant(s: string) {
  if (s === 'REGISTERED') return 'green'
  if (s === 'ABANDONED' || s === 'EXPIRED') return 'red'
  return 'blue'
}

onMounted(load)
</script>

<style scoped>
.detail-page {
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 스켈레톤 ─────────────────────────────────────── */
.detail-skeleton { display: flex; flex-direction: column; gap: 14px; }
.skel {
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf5 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: shimmer 1.5s infinite;
}
.skel--title  { height: 28px; width: 60%; }
.skel--sub    { height: 16px; width: 40%; }
.skel--tabs   { height: 42px; }
.skel--body   { height: 320px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── 상단 헤더 ───────────────────────────────────── */
.detail-header { display: flex; flex-direction: column; gap: 12px; }

.detail-header__top {
  display: flex; align-items: center; justify-content: space-between;
}

.back-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: #64748b; font-family: inherit;
  padding: 6px 0;
  transition: color 0.13s;
}
.back-btn:hover { color: #0f172a; }

.detail-header__actions { display: flex; gap: 8px; }

.hdr-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; color: #374151;
  transition: background 0.13s;
}
.hdr-btn:hover { background: #f8fafc; }
.hdr-btn--danger { color: #dc2626; border-color: #fecaca; }
.hdr-btn--danger:hover { background: #fef2f2; }

.detail-header__main { display: flex; flex-direction: column; gap: 10px; }

.detail-header__title-row {
  display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap;
}

.detail-title {
  font-size: 22px; font-weight: 700; color: #0f172a;
  line-height: 1.35; letter-spacing: -0.02em; margin: 0;
  flex: 1; min-width: 200px;
}

.detail-meta-chips { display: flex; flex-wrap: wrap; gap: 8px; }

.meta-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px;
  font-size: 12.5px; font-weight: 500; color: #475569;
}
.meta-chip--danger { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.meta-chip--warn   { background: #fffbeb; border-color: #fde68a; color: #b45309; }

/* ── 본문 레이아웃 ───────────────────────────────── */
.detail-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-body { grid-template-columns: 1fr; }
  .detail-aside { order: -1; }
}

/* ── 탭 ──────────────────────────────────────────── */
.detail-main { display: flex; flex-direction: column; gap: 0; }

.tabs {
  display: flex; gap: 0;
  border-bottom: 1.5px solid #e2e8f0;
  margin-bottom: 0;
}

.tab {
  padding: 12px 18px;
  background: none; border: none; cursor: pointer;
  font-size: 13.5px; font-weight: 500; font-family: inherit; color: #64748b;
  position: relative;
  transition: color 0.13s;
  white-space: nowrap;
}
.tab:hover { color: #0f172a; }
.tab--active {
  color: #4f46e5; font-weight: 700;
}
.tab--active::after {
  content: '';
  position: absolute;
  bottom: -1.5px; left: 0; right: 0;
  height: 2px; background: #4f46e5;
  border-radius: 2px 2px 0 0;
}

.tab-content {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 14px 14px;
  padding: 24px;
  min-height: 400px;
}

/* ── 정보 섹션 ───────────────────────────────────── */
.info-section { margin-bottom: 28px; }
.info-section:last-child { margin-bottom: 0; }
.info-section__title {
  font-size: 13px; font-weight: 700; color: #374151;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.info-item {}
.info-item__label { font-size: 11.5px; font-weight: 600; color: #94a3b8; margin: 0 0 3px; text-transform: uppercase; letter-spacing: 0.04em; }
.info-item__value { font-size: 13.5px; color: #0f172a; margin: 0; }
.mono { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 12.5px; }

.info-text { font-size: 14px; color: #374151; line-height: 1.8; margin: 0; }

.keyword-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.kw-chip {
  padding: 4px 10px;
  background: #eef2ff; border-radius: 6px;
  font-size: 12.5px; font-weight: 500; color: #4338ca;
}
.kw-chip--product {
  background: #f0fdf4; color: #15803d;
}

.pdf-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
}
.pdf-row__left { display: flex; align-items: center; gap: 12px; }
.pdf-icon {
  width: 38px; height: 38px; background: #eef2ff; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; color: #6366f1; flex-shrink: 0;
}
.pdf-row__name { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0 0 2px; }
.pdf-row__key  { font-size: 11.5px; color: #94a3b8; margin: 0; font-family: monospace; }

.btn-download {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; color: #374151;
  transition: background 0.13s;
}
.btn-download:hover { background: #f1f5f9; }

/* ── 연차료 ──────────────────────────────────────── */
.annuity-section { display: flex; flex-direction: column; gap: 16px; }
.annuity-header { display: flex; align-items: center; justify-content: space-between; }

.annuity-form {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
}
.annuity-form__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.annuity-form__actions { display: flex; justify-content: flex-end; gap: 8px; }

.btn-sm {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 7px;
  font-size: 12.5px; font-weight: 500; font-family: inherit; cursor: pointer; color: #374151;
  transition: background 0.12s;
}
.btn-sm:hover { background: #f1f5f9; }

.btn-cancel-sm { padding: 7px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer; color: #475569; }
.btn-confirm-sm { padding: 7px 14px; background: #0f172a; color: #fff; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }

.annuity-table-wrap { overflow-x: auto; }
.annuity-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.annuity-table th { padding: 8px 12px; text-align: left; font-size: 11.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; }
.annuity-table td { padding: 12px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }

.annuity-status {
  display: inline-block; padding: 2px 8px; border-radius: 5px;
  font-size: 12px; font-weight: 600;
}
.annuity-status--paid   { background: #f0fdf4; color: #15803d; }
.annuity-status--unpaid { background: #fef2f2; color: #dc2626; }

.empty-mini { padding: 32px; text-align: center; font-size: 13.5px; color: #94a3b8; }

/* ── 권리 상태 타임라인 ──────────────────────────── */
.timeline { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.timeline-item { display: flex; gap: 14px; position: relative; padding-bottom: 20px; }
.timeline-item:last-child { padding-bottom: 0; }

.timeline-item__dot {
  width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
  position: relative; z-index: 1;
}
.tl-dot--green { background: #22c55e; }
.tl-dot--red   { background: #ef4444; }
.tl-dot--blue  { background: #3b82f6; }

.timeline-item__line {
  position: absolute;
  left: 5px; top: 16px; bottom: 0;
  width: 2px; background: #f1f5f9;
}

.timeline-item__content { display: flex; align-items: center; gap: 10px; }
.timeline-item__date { font-size: 12.5px; color: #94a3b8; }

/* ── 사이드 패널 ─────────────────────────────────── */
.detail-aside { display: flex; flex-direction: column; gap: 14px; }

.aside-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.aside-card--decision { border-color: #c7d2fe; background: #fafbff; }

.aside-card__title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: #374151;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin: 0;
}

.dept-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #0f172a;
}
.dept-info__dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }

.aside-empty { font-size: 13px; color: #94a3b8; margin: 0; }

.aside-btn {
  width: 100%; padding: 9px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; color: #374151;
  transition: background 0.13s;
}
.aside-btn:hover { background: #f1f5f9; }

.aside-info-list { display: flex; flex-direction: column; gap: 8px; }
.aside-info-item { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.aside-info-item__label { font-size: 12px; color: #94a3b8; font-weight: 500; flex-shrink: 0; }
.aside-info-item__value { font-size: 12.5px; color: #0f172a; font-weight: 500; text-align: right; }

/* ── 결정 폼 ─────────────────────────────────────── */
.decision-form { display: flex; flex-direction: column; gap: 12px; }

.decision-btns { display: flex; gap: 6px; }
.decision-btn {
  flex: 1; padding: 8px 6px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: #fff; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  color: #64748b; transition: border-color 0.13s, background 0.13s, color 0.13s;
}
.decision-btn:hover { background: #f8fafc; }
.decision-btn--keep.decision-btn--selected    { border-color: #22c55e; background: #f0fdf4; color: #15803d; }
.decision-btn--sell.decision-btn--selected    { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.decision-btn--dispose.decision-btn--selected { border-color: #ef4444; background: #fef2f2; color: #dc2626; }

.decision-textarea {
  width: 100%; padding: 10px 12px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  font-size: 13px; font-family: inherit; color: #0f172a; background: #fafafa;
  resize: vertical; outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.decision-textarea:focus { border-color: #6366f1; background: #fff; }

.btn-submit-decision {
  width: 100%; padding: 11px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff; border: none; border-radius: 9px;
  font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,70,229,0.3);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.13s;
}
.btn-submit-decision:disabled { opacity: 0.55; cursor: not-allowed; }

.decision-done { display: flex; flex-direction: column; gap: 8px; }
.decision-done__badge {
  display: inline-flex; padding: 5px 12px; border-radius: 8px;
  font-size: 14px; font-weight: 700; align-self: flex-start;
}
.decision-done__badge--keep    { background: #f0fdf4; color: #15803d; }
.decision-done__badge--sell    { background: #eef2ff; color: #4338ca; }
.decision-done__badge--dispose { background: #fef2f2; color: #dc2626; }
.decision-done__date    { font-size: 12px; color: #94a3b8; margin: 0; }
.decision-done__comment { font-size: 13px; color: #374151; margin: 0; line-height: 1.6; padding: 10px 12px; background: #f8fafc; border-radius: 8px; }

/* ── 공통 폼 필드 ─────────────────────────────────── */
.field { display: flex; flex-direction: column; gap: 5px; }
.field__label { font-size: 12px; font-weight: 600; color: #374151; }
.field__input {
  padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 13.5px; font-family: inherit; color: #0f172a; background: #fafafa;
  outline: none; transition: border-color 0.15s;
}
.field__input:focus { border-color: #6366f1; background: #fff; }

/* ── 모달 ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(2px);
}
.modal {
  background: #fff; border-radius: 18px;
  width: min(580px, 94vw);
  box-shadow: 0 24px 64px rgba(15,23,42,0.18); overflow: hidden;
}
.modal--sm { width: min(400px, 94vw); }
.modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
}
.modal__title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
.modal__close {
  width: 32px; height: 32px; background: #f1f5f9; border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b;
}
.modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.modal__label { font-size: 12.5px; font-weight: 600; color: #374151; margin: 0 0 5px; }
.modal__footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 24px 20px; border-top: 1px solid #f1f5f9; }

.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #374151; cursor: pointer; }
.checkbox-row input { width: 15px; height: 15px; cursor: pointer; accent-color: #6366f1; }

.btn-cancel {
  padding: 9px 20px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer; color: #475569;
}
.btn-confirm {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff; border: none; border-radius: 9px;
  font-size: 13.5px; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 12px rgba(79,70,229,0.3);
}
.btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner-sm { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 슬라이드 다운 */
.slide-down-enter-active { transition: max-height 0.25s ease, opacity 0.2s; max-height: 400px; }
.slide-down-leave-active { transition: max-height 0.2s ease, opacity 0.15s; }
.slide-down-enter-from, .slide-down-leave-to { max-height: 0; opacity: 0; }

/* 모달 전환 */
.modal-enter-active { transition: opacity 0.2s; }
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal { animation: modalUp 0.22s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes modalUp { from { transform: translateY(12px) scale(0.98); } to { transform: translateY(0) scale(1); } }

/* 에러 */
.detail-error { padding: 48px; text-align: center; color: #64748b; }
</style>
