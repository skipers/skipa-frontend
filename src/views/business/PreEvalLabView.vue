<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

type Grade = 'S' | 'A' | 'B' | 'C'
type ChatRole = 'assistant' | 'user'

interface EvaluationMetric {
  key: 'tech' | 'rights' | 'business'
  label: string
  score: number
  comment: string
}

interface EvaluationResult {
  ipc: string
  grade: Grade
  gradeDescription: string
  overallComment: string
  metrics: EvaluationMetric[]
}

interface EvaluationInputs {
  patentName: string
  techDescription: string
  claimInputs: string[]
  relatedBusiness: string
  targetCountries: string
}

interface EvaluationHistoryItem {
  id: string
  patentName: string
  evaluatedAt: string
  inputs: EvaluationInputs
  evaluation: EvaluationResult
}

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
  typing?: boolean
}

const HISTORY_KEY = 'skipa_pre_eval_history'

const DUMMY_HISTORY: EvaluationHistoryItem[] = [
  {
    id: 'demo-3',
    patentName: '머신러닝 기반 웨이퍼 불량 검출 시스템',
    evaluatedAt: '2026-03-10T09:30:00.000Z',
    inputs: {
      patentName: '머신러닝 기반 웨이퍼 불량 검출 시스템',
      techDescription: 'CNN 기반 이미지 분류 모델을 활용하여 웨이퍼 표면의 불량을 실시간으로 검출하는 시스템입니다.',
      claimInputs: ['웨이퍼 이미지를 입력받아 불량 여부를 분류하는 단계', '불량 위치를 히트맵으로 시각화하는 단계'],
      relatedBusiness: '반도체 제조 공정 품질관리',
      targetCountries: '한국, 미국, 일본',
    },
    evaluation: {
      ipc: 'G06T 7/00',
      grade: 'A',
      gradeDescription: '우수, 출원 권고',
      overallComment: '선행기술 대비 차별 포인트를 명세서에서 더 명확히 제시하면 종합 등급 상향 가능성이 있습니다.',
      metrics: [
        { key: 'tech',     label: '기술성', score: 84, comment: '기술성 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.' },
        { key: 'rights',   label: '권리성', score: 78, comment: '권리성는 평균 이상입니다.\n청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.' },
        { key: 'business', label: '사업성', score: 81, comment: '사업성 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.' },
      ],
    },
  },
  {
    id: 'demo-2',
    patentName: '5G 기반 실시간 데이터 압축 알고리즘',
    evaluatedAt: '2026-02-25T14:00:00.000Z',
    inputs: {
      patentName: '5G 기반 실시간 데이터 압축 알고리즘',
      techDescription: '5G 네트워크 환경에서 지연 없이 대용량 데이터를 압축 전송하는 알고리즘입니다.',
      claimInputs: ['적응형 압축률 조절 방법'],
      relatedBusiness: '통신 인프라 및 클라우드 서비스',
      targetCountries: '한국, 미국, 유럽',
    },
    evaluation: {
      ipc: 'H04L 29/08',
      grade: 'B',
      gradeDescription: '보통, 보완 후 출원 검토',
      overallComment: '전반적으로 보완이 필요합니다. 청구항 범위와 기술 차별성을 강화하면 등급 개선이 기대됩니다.',
      metrics: [
        { key: 'tech',     label: '기술성', score: 72, comment: '기술성는 평균 이상입니다.\n청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.' },
        { key: 'rights',   label: '권리성', score: 65, comment: '권리성는 평균 이상입니다.\n청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.' },
        { key: 'business', label: '사업성', score: 68, comment: '사업성는 평균 이상입니다.\n청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.' },
      ],
    },
  },
  {
    id: 'demo-1',
    patentName: '자율주행 장애물 회피 경로 계획 기술',
    evaluatedAt: '2026-01-15T11:00:00.000Z',
    inputs: {
      patentName: '자율주행 장애물 회피 경로 계획 기술',
      techDescription: '라이다 및 카메라 센서 융합을 통해 동적 장애물을 실시간으로 감지하고 최적 경로를 재계획하는 기술입니다.',
      claimInputs: ['센서 융합으로 장애물을 감지하는 단계', '충돌 없는 경로를 실시간 재계획하는 단계', '경로 전환을 차량에 전달하는 단계'],
      relatedBusiness: '자율주행 차량 및 모빌리티 플랫폼',
      targetCountries: '한국, 미국, 독일, 중국',
    },
    evaluation: {
      ipc: 'B60W 50/00',
      grade: 'S',
      gradeDescription: '매우 우수, 적극 출원 권고',
      overallComment: '세 평가 영역 모두 최상위 수준입니다. 즉시 출원을 권고합니다.',
      metrics: [
        { key: 'tech',     label: '기술성', score: 93, comment: '기술성 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.' },
        { key: 'rights',   label: '권리성', score: 88, comment: '권리성 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.' },
        { key: 'business', label: '사업성', score: 91, comment: '사업성 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.' },
      ],
    },
  },
]

function loadHistory(): EvaluationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as EvaluationHistoryItem[]) : DUMMY_HISTORY
  } catch {
    return DUMMY_HISTORY
  }
}

function saveHistory(items: EvaluationHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

// ── 입력 폼 ──────────────────────────────────────────
const patentName      = ref('')
const techDescription = ref('')
const claimInputs     = ref([''])
const relatedBusiness = ref('')
const targetCountries = ref('')

// ── 상태 ─────────────────────────────────────────────
const evaluation       = ref<EvaluationResult | null>(null)
const history          = ref<EvaluationHistoryItem[]>(loadHistory())
const selectedHistoryId   = ref<string | null>(null)
const historyDropdownOpen = ref(false)

const chatbotOpen     = ref(false)
const chatbotExpanded = ref(false)
const chatInput       = ref('')
const chatMessages    = ref<ChatMessage[]>([
  { id: 1, role: 'assistant', text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.' },
])

const chatViewport  = ref<HTMLElement | null>(null)
const messageId     = ref(2)
const pendingTimers = new Set<number>()

// ── computed ──────────────────────────────────────────
const isStartEnabled = computed(() =>
  Boolean(patentName.value.trim() && techDescription.value.trim())
)

const chatPanelWidth = computed(() =>
  chatbotOpen.value ? (chatbotExpanded.value ? '100vw' : '480px') : '0px'
)

const displayedEvaluation = computed<EvaluationResult | null>(() => {
  if (selectedHistoryId.value) {
    return history.value.find((item) => item.id === selectedHistoryId.value)?.evaluation ?? null
  }
  return evaluation.value
})

const selectedHistoryItem = computed(() =>
  history.value.find((item) => item.id === selectedHistoryId.value) ?? null
)

// ── 유틸 ─────────────────────────────────────────────
const gradeDescriptions: Record<Grade, string> = {
  S: '매우 우수, 적극 출원 권고',
  A: '우수, 출원 권고',
  B: '보통, 보완 후 출원 검토',
  C: '미흡, 출원 재검토 권고',
}

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.')
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function nextMessageId() {
  return messageId.value++
}

function scrollChatToBottom() {
  if (chatViewport.value) chatViewport.value.scrollTop = chatViewport.value.scrollHeight
}

function buildMetricComment(label: string, score: number) {
  if (score >= 80) return `${label} 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.`
  if (score >= 65) return `${label}는 평균 이상입니다.\n다만 청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.`
  return `${label} 보완이 필요합니다.\n권리 포인트와 적용 시나리오를 더 선명하게 정리해 주세요.`
}

function resolveIpc() {
  const src = `${techDescription.value} ${claimInputs.value.join(' ')} ${relatedBusiness.value}`.toLowerCase()
  const rules = [
    { kw: ['영상', '이미지', '비전', '카메라', '인식', '분석'], code: 'G06T 7/00' },
    { kw: ['통신', '네트워크', '서버', 'api', '데이터 전송'],   code: 'H04L 29/08' },
    { kw: ['의료', '진단', '헬스', '병원', '생체'],             code: 'A61B 5/00' },
    { kw: ['차량', '모빌리티', '운전', '자율주행', '교통'],     code: 'B60W 50/00' },
    { kw: ['결제', '쇼핑', '커머스', '광고', '마케팅'],         code: 'G06Q 30/02' },
  ] as const
  return rules.find(({ kw }) => kw.some((k) => src.includes(k)))?.code ?? 'G06F 17/30'
}

function buildEvaluationResult(): EvaluationResult {
  const dLen  = techDescription.value.trim().length
  const claims = claimInputs.value.map((c) => c.trim()).filter(Boolean)
  const cnt   = Math.max(1, claims.length)
  const pLen  = patentName.value.trim().length
  const bLen  = relatedBusiness.value.trim().length
  const cLen  = targetCountries.value.trim().length

  const tech = clamp(Math.round(52 + dLen / 8 + cnt * 3.5), 0, 100)
  const rights = clamp(Math.round(48 + pLen / 5 + cnt * 6.5), 0, 100)
  const biz  = clamp(Math.round(46 + bLen / 6 + cLen / 7 + cnt * 2), 0, 100)
  const avg  = Math.round((tech + rights + biz) / 3)
  const grade: Grade = avg >= 90 ? 'S' : avg >= 80 ? 'A' : avg >= 65 ? 'B' : 'C'

  const overallMap: Record<Grade, string> = {
    S: '세 평가 영역 모두 최상위 수준입니다. 즉시 출원을 권고합니다.',
    A: '선행기술 대비 차별 포인트를 명세서에서 더 명확히 제시하면 종합 등급 상향 가능성이 있습니다.',
    B: '전반적으로 보완이 필요합니다. 청구항 범위와 기술 차별성을 강화하면 등급 개선이 기대됩니다.',
    C: '출원 전 기술 설명과 청구 범위를 전면 재검토하는 것을 권고합니다.',
  }

  return {
    ipc: resolveIpc(),
    grade,
    gradeDescription: gradeDescriptions[grade],
    overallComment: overallMap[grade],
    metrics: [
      { key: 'tech',     label: '기술성', score: tech,   comment: buildMetricComment('기술성', tech) },
      { key: 'rights',   label: '권리성', score: rights, comment: buildMetricComment('권리성', rights) },
      { key: 'business', label: '사업성', score: biz,    comment: buildMetricComment('사업성', biz) },
    ],
  }
}

// ── 액션 ─────────────────────────────────────────────
function startEvaluation() {
  if (!isStartEnabled.value) return
  const result = buildEvaluationResult()
  evaluation.value = result
  selectedHistoryId.value = null

  const item: EvaluationHistoryItem = {
    id: `${Date.now()}`,
    patentName: patentName.value.trim(),
    evaluatedAt: new Date().toISOString(),
    inputs: {
      patentName: patentName.value.trim(),
      techDescription: techDescription.value.trim(),
      claimInputs: claimInputs.value.map((c) => c.trim()).filter(Boolean),
      relatedBusiness: relatedBusiness.value.trim(),
      targetCountries: targetCountries.value.trim(),
    },
    evaluation: result,
  }
  history.value.unshift(item)
  saveHistory(history.value)
}

function resetAssessment() {
  patentName.value = ''
  techDescription.value = ''
  claimInputs.value = ['']
  relatedBusiness.value = ''
  targetCountries.value = ''
  evaluation.value = null
  selectedHistoryId.value = null
  historyDropdownOpen.value = false
  chatInput.value = ''
  chatbotOpen.value = false
  chatbotExpanded.value = false
  chatMessages.value = [
    { id: 1, role: 'assistant', text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.' },
  ]
  pendingTimers.forEach((t) => window.clearTimeout(t))
  pendingTimers.clear()
  messageId.value = 2
}

function selectHistory(id: string) {
  selectedHistoryId.value = id
  evaluation.value = null
}

function selectHistoryFromDropdown(id: string) {
  selectHistory(id)
  historyDropdownOpen.value = false
}

function addClaimInput() { claimInputs.value.push('') }
function removeClaimInput(i: number) {
  if (claimInputs.value.length <= 1) { claimInputs.value = ['']; return }
  claimInputs.value.splice(i, 1)
}

async function toggleChatbot() {
  chatbotOpen.value = !chatbotOpen.value
  if (!chatbotOpen.value) { chatbotExpanded.value = false; return }
  await nextTick()
  scrollChatToBottom()
}
function closeChatbot() { chatbotOpen.value = false; chatbotExpanded.value = false }

async function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text) return
  if (!chatbotOpen.value) { chatbotOpen.value = true; await nextTick() }

  chatMessages.value.push({ id: nextMessageId(), role: 'user', text })
  chatInput.value = ''

  const typingId = nextMessageId()
  chatMessages.value.push({ id: typingId, role: 'assistant', text: '', typing: true })
  await nextTick()
  scrollChatToBottom()

  const timerId = window.setTimeout(() => {
    const idx = chatMessages.value.findIndex((m) => m.id === typingId)
    if (idx !== -1) {
      chatMessages.value.splice(idx, 1, {
        id: nextMessageId(),
        role: 'assistant',
        text: '해당 특허의 평가 결과를 분석한 결과, 기술적 독창성이 높게 평가되었습니다. 추가적으로 궁금한 점이 있으시면 질문해주세요.',
      })
    }
    pendingTimers.delete(timerId)
    void nextTick(() => { scrollChatToBottom() })
  }, 1000)
  pendingTimers.add(timerId)
}

function handleChatKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendChatMessage() }
}

onBeforeUnmount(() => {
  pendingTimers.forEach((t) => window.clearTimeout(t))
  pendingTimers.clear()
})
</script>

<template>
  <div class="lab-page" :style="{ '--chat-width': chatPanelWidth }">

    <!-- ══════════════════════════════════════════════
         메인 콘텐츠
    ══════════════════════════════════════════════ -->
    <div class="lab-main">

      <!-- 상단 바 -->
      <div class="top-bar">
        <div class="top-bar__left">
          <div class="top-bar__title-row">
            <div>
              <p class="top-bar__title">사전 평가 Lab</p>
              <p class="top-bar__sub">출원 전 발명을 AI로 사전 진단합니다.</p>
            </div>
            <button class="btn-new-eval" type="button" @click="resetAssessment">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              새 평가
            </button>
          </div>
        </div>

        <!-- 평가 이력 드롭다운 -->
        <div class="history-dropdown" :class="{ 'history-dropdown--open': historyDropdownOpen }">
          <button class="btn-history" type="button" @click="historyDropdownOpen = !historyDropdownOpen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            평가 이력
            <span class="history-count">{{ history.length }}</span>
            <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          <div class="history-dropdown__menu">
            <ul class="dropdown-list">
              <li
                v-for="item in history"
                :key="item.id"
                class="dropdown-item"
                :class="{ 'dropdown-item--active': selectedHistoryId === item.id }"
                @click="selectHistoryFromDropdown(item.id)"
              >
                <p class="dropdown-item__name">{{ item.patentName }}</p>
                <div class="dropdown-item__meta">
                  <span class="dropdown-item__date">{{ formatDate(item.evaluatedAt) }}</span>
                  <span class="grade-pill" :class="`grade-pill--${item.evaluation.grade.toLowerCase()}`">
                    {{ item.evaluation.grade }}
                  </span>
                </div>
              </li>
              <li v-if="history.length === 0" class="dropdown-empty">평가 이력이 없습니다.</li>
            </ul>
          </div>
        </div>

        <!-- 드롭다운 외부 클릭 닫기 -->
        <div v-if="historyDropdownOpen" class="dropdown-backdrop" @click="historyDropdownOpen = false" />
      </div>


      <!-- 2열 그리드 -->
      <main class="lab-grid">

        <!-- 입력폼 -->
        <section class="panel form-panel">
            <!-- 읽기 전용 뷰 (히스토리 선택 시) -->
          <template v-if="selectedHistoryItem">
            <div class="readonly-header">
              <h2 class="panel-title readonly-panel-title">{{ selectedHistoryItem.patentName }}</h2>
              <p class="readonly-date">평가일 {{ formatDate(selectedHistoryItem.evaluatedAt) }}</p>
            </div>

            <div class="readonly-fields">
              <div class="readonly-field">
                <p class="readonly-field__label">특허명</p>
                <p class="readonly-field__value">{{ selectedHistoryItem.inputs.patentName || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">기술 설명</p>
                <p class="readonly-field__value">{{ selectedHistoryItem.inputs.techDescription || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">청구항</p>
                <div v-if="selectedHistoryItem.inputs.claimInputs.length" class="readonly-field__value readonly-field__value--claims">
                  <ol class="readonly-claim-list">
                    <li v-for="(claim, i) in selectedHistoryItem.inputs.claimInputs" :key="i">{{ claim }}</li>
                  </ol>
                </div>
                <p v-else class="readonly-field__value readonly-field__value--empty">-</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">관련 사업</p>
                <p class="readonly-field__value">{{ selectedHistoryItem.inputs.relatedBusiness || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">출원 예정 국가</p>
                <p class="readonly-field__value">{{ selectedHistoryItem.inputs.targetCountries || '-' }}</p>
              </div>
            </div>
          </template>

          <!-- 입력 폼 -->
          <template v-else>
            <h2 class="panel-title">발명 정보 입력</h2>

            <form class="form-stack" @submit.prevent="startEvaluation">
              <label class="field">
                <span class="field__label">특허명 <em>*</em></span>
                <input v-model="patentName" type="text" placeholder="예: 영상 분석 기반 위험 예측 시스템" />
              </label>

              <label class="field">
                <span class="field__label">기술 설명 <em>*</em></span>
                <textarea v-model="techDescription" rows="4" placeholder="핵심 기술의 작동 방식, 차별점, 활용 맥락을 입력하세요." />
              </label>

              <div class="claim-group">
                <div class="claim-header">
                  <span class="field__label">청구항</span>
                  <button class="claim-btn claim-btn--add" type="button" @click="addClaimInput">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    추가
                  </button>
                </div>
                <div class="claim-list">
                  <div v-for="(_, index) in claimInputs" :key="index" class="claim-row">
                    <textarea
                      v-model="claimInputs[index]"
                      class="claim-textarea"
                      rows="2"
                      placeholder="청구항 내용을 입력하세요."
                    />
                    <button
                      v-if="claimInputs.length > 1"
                      class="claim-btn claim-btn--remove"
                      type="button"
                      @click="removeClaimInput(index)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="two-col">
                <label class="field">
                  <span class="field__label">관련 사업</span>
                  <input v-model="relatedBusiness" type="text" placeholder="예: 반도체 제조 공정 품질관리" />
                </label>
                <label class="field">
                  <span class="field__label">출원 예정 국가</span>
                  <input v-model="targetCountries" type="text" placeholder="예: 한국, 미국, 유럽" />
                </label>
              </div>

              <button class="btn-primary" type="submit" :disabled="!isStartEnabled">평가 시작</button>
            </form>
          </template>
        </section>

        <!-- 평가 결과 -->
        <section class="panel result-panel">
          <div v-if="!displayedEvaluation" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 64 64" fill="none">
                <rect x="10" y="10" width="44" height="44" rx="14"/>
                <path d="M22 28.5L31.2 20l4.8 5.2L42.5 20 50 27.3V42a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V29l8-8.5 4 4z"/>
                <path d="M18 39.5h28"/>
              </svg>
            </div>
            <p>발명 정보를 입력하고 평가를 시작하면<br/>결과가 여기에 표시됩니다.</p>
          </div>

          <template v-else>
            <div class="ipc-row">
              <span class="ipc-row__label">AI 자동 분류 IPC</span>
              <strong class="ipc-row__code">{{ displayedEvaluation.ipc }}</strong>
            </div>

            <div class="grade-card">
              <p class="grade-card__kicker">종합 등급</p>
              <p class="grade-card__letter">{{ displayedEvaluation.grade }}</p>
            </div>

            <div class="metrics-strip">
              <div
                v-for="(metric, i) in displayedEvaluation.metrics"
                :key="metric.key"
                class="metric-col"
                :class="{ 'metric-col--last': i === displayedEvaluation.metrics.length - 1 }"
              >
                <div class="metric-col__row">
                  <span class="metric-col__label">{{ metric.label }}</span>
                  <strong class="metric-col__score">{{ metric.score }}점</strong>
                </div>
                <div class="metric-col__track">
                  <div class="metric-col__fill" :style="{ width: metric.score + '%' }"/>
                </div>
              </div>
            </div>

            <div class="comment-list">
              <div v-for="metric in displayedEvaluation.metrics" :key="metric.key + '-c'" class="comment-item">
                <p class="comment-item__label">{{ metric.label }} 코멘트</p>
                <p class="comment-item__text">{{ metric.comment }}</p>
              </div>
              <div class="comment-item comment-item--overall">
                <p class="comment-item__label">종합 코멘트</p>
                <p class="comment-item__text">{{ displayedEvaluation.overallComment }}</p>
              </div>
            </div>
          </template>
        </section>

      </main>
    </div><!-- /lab-main -->

    <!-- ── 챗봇 FAB ── -->
    <button v-if="!chatbotOpen" class="chat-fab" type="button" aria-label="AI 챗봇에게 질문하기" @click="toggleChatbot">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- ── 챗봇 패널 ── -->
    <aside class="chat-panel" :class="{ open: chatbotOpen, expanded: chatbotExpanded }">
      <div class="chat-shell">
        <header class="chat-header">
          <button class="icon-button" type="button" @click="chatbotExpanded = !chatbotExpanded">
            <svg v-if="!chatbotExpanded" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 9V5h4M19 15v4h-4M5 15v4h4M19 9V5h-4"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 10V6h4M10 14v4H6M10 10 6 6M18 18l-4-4"/>
            </svg>
          </button>
          <strong>SKIPA AI</strong>
          <button class="icon-button" type="button" @click="closeChatbot">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18"/>
            </svg>
          </button>
        </header>

        <div ref="chatViewport" class="chat-body">
          <div v-for="message in chatMessages" :key="message.id" class="chat-row" :class="message.role">
            <div class="chat-bubble" :class="message.role">
              <template v-if="message.typing">
                <span class="typing-dots"><span/><span/><span/></span>
              </template>
              <template v-else>{{ message.text }}</template>
            </div>
          </div>
        </div>

        <form class="chat-composer" @submit.prevent="sendChatMessage">
          <input v-model="chatInput" type="text" placeholder="평가 결과에 대해 질문해 보세요." @keydown="handleChatKeydown"/>
          <button type="submit">전송</button>
        </form>
      </div>
    </aside>

  </div>
</template>

<style scoped>
/* ── CSS 변수 & 루트 ──────────────────────────────── */
.lab-page {
  --accent:        #6366f1;
  --accent-hover:  #4f46e5;
  --accent-soft:   rgba(99, 102, 241, 0.12);
  --navy:          #0f172a;
  --chat-width:    0px;

  position: relative;
  background: #f5f4f0;
  font-family: 'Pretendard', sans-serif;
}

/* 등급 뱃지 */
.grade-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}
.grade-pill--s { background: #dcfce7; color: #14532d; }
.grade-pill--a { background: #dbeafe; color: #1e3a8a; }
.grade-pill--b { background: #fff7ed; color: #7c2d12; }
.grade-pill--c { background: #f1f5f9; color: #475569; }

/* ══════════════════════════════════════════════════
   메인 콘텐츠 영역
══════════════════════════════════════════════════ */
.lab-main {
  padding-right: var(--chat-width);
  transition: padding-right 0.3s ease;
}

/* ── 상단 바 ──────────────────────────────────────── */
.top-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.top-bar__title-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.top-bar__title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.top-bar__sub   { font-size: 12px; color: #94a3b8; margin: 0; }
.btn-new-eval {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600; white-space: nowrap;
  background: #3b82f6; color: #fff;
  transition: background 0.15s;
}
.btn-new-eval:hover { background: #2563eb; }

/* ── 평가 이력 드롭다운 ──────────────────────────── */
.history-dropdown { }

.btn-history {
  display: flex; align-items: center; gap: 7px;
  width: 100%; height: 38px; padding: 0 14px;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff; color: #475569;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  box-sizing: border-box;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.btn-history:hover { border-color: var(--accent); color: var(--accent); }
.history-dropdown--open .btn-history {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.history-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11px; font-weight: 700; border-radius: 9px;
}

.chevron-icon {
  margin-left: auto;
  transition: transform 0.2s ease;
}
.history-dropdown--open .chevron-icon { transform: rotate(180deg); }

.history-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  width: auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  z-index: 100;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.history-dropdown--open .history-dropdown__menu {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.dropdown-list {
  list-style: none; margin: 0; padding: 6px 0;
  max-height: 480px; overflow-y: auto;
}
.dropdown-list::-webkit-scrollbar { width: 4px; }
.dropdown-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.12s;
}
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item--active {
  background: #eef2ff;
  border-left: 3px solid var(--accent);
  padding-left: 13px;
}

.dropdown-item__name {
  font-size: 13px; font-weight: 600; color: #0f172a;
  margin: 0 0 6px; line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dropdown-item--active .dropdown-item__name { color: #4f46e5; }

.dropdown-item__meta {
  display: flex; align-items: center;
  justify-content: space-between; gap: 8px;
}
.dropdown-item__date { font-size: 11.5px; color: #94a3b8; }

.dropdown-empty {
  padding: 32px 20px;
  text-align: center;
  font-size: 13px; color: #94a3b8;
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}


/* ── 그리드 ───────────────────────────────────────── */
.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 40%) minmax(0, 60%);
  gap: 20px;
  align-items: stretch;
}

/* ── 패널 공통 ────────────────────────────────────── */
.panel {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
}
.form-panel   { padding: 28px 24px; display: flex; flex-direction: column; }
.result-panel { padding: 28px 24px; display: flex; flex-direction: column; }


/* ── 폼 ───────────────────────────────────────────── */
.panel-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 22px; }

.form-stack { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 7px; }
.field__label { font-size: 13.5px; font-weight: 600; color: #223247; }
.field__label em { color: #b42318; font-style: normal; }

.field input,
.field textarea,
.claim-textarea {
  width: 100%; box-sizing: border-box;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px; padding: 10px 14px;
  font-size: 14px; font-family: inherit; color: #102033;
  background: #fff; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field input:focus,
.field textarea:focus,
.claim-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.field input::placeholder,
.field textarea::placeholder,
.claim-textarea::placeholder { color: #94a3b8; font-size: 13px; }
.field textarea { resize: vertical; min-height: 96px; }

.claim-group  { display: flex; flex-direction: column; gap: 8px; }
.claim-header { display: flex; align-items: center; gap: 8px; }
.claim-list   { display: flex; flex-direction: column; gap: 8px; }
.claim-row    { display: flex; align-items: flex-start; gap: 8px; }
.claim-textarea { min-height: 64px; resize: vertical; }

.claim-btn--add {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 9px; border-radius: 6px;
  border: 1.5px solid var(--accent, #6366f1);
  background: transparent; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--accent, #6366f1);
  transition: background 0.13s, color 0.13s;
}
.claim-btn--add:hover { background: var(--accent-soft, #eef2ff); }
.claim-btn--add svg { width: 11px; height: 11px; }

.claim-btn--remove {
  flex-shrink: 0; width: 28px; height: 28px; margin-top: 4px;
  border: none; border-radius: 6px;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8;
  transition: color 0.13s, background 0.13s;
}
.claim-btn--remove:hover { color: #ef4444; background: #fef2f2; }
.claim-btn--remove svg { width: 14px; height: 14px; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.btn-primary {
  width: 100%; height: 50px; border: none; border-radius: 14px;
  background: var(--accent); color: #fff;
  font-size: 15px; font-weight: 800; font-family: inherit; cursor: pointer;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.28);
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 10px 28px rgba(99, 102, 241, 0.38);
  transform: translateY(-1px);
}
.btn-primary:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }

/* ── 읽기 전용 뷰 ─────────────────────────────────── */
.readonly-header { margin-bottom: 24px; }

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: none;
  background: none;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-bottom: 14px;
  transition: color 0.13s;
}
.btn-back:hover { color: var(--accent-hover); }
.btn-back svg { width: 13px; height: 13px; flex-shrink: 0; }

.readonly-panel-title { margin-bottom: 4px; }

.readonly-date {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.readonly-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.readonly-field { display: flex; flex-direction: column; gap: 6px; }

.readonly-field__label {
  font-size: 13.5px;
  font-weight: 600;
  color: #223247;
  margin: 0;
}

.readonly-field__value {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.7;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.readonly-field__value--empty { color: #94a3b8; }
.readonly-field__value--claims { padding: 10px 14px; }

.readonly-claim-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.readonly-claim-list li {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.65;
}

/* ── 결과 패널 ────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex: 1; gap: 16px;
  color: #94a3b8; text-align: center;
}
.empty-icon {
  width: 80px; height: 80px; border-radius: 24px;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
}
.empty-icon svg { width: 48px; height: 48px; stroke: #94a3b8; stroke-width: 1.5; fill: none; }
.empty-state p  { font-size: 14px; font-weight: 500; line-height: 1.75; }

.ipc-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.ipc-row__label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.ipc-row__code  { font-size: 16px; font-weight: 800; color: #0f172a; }

.grade-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 22px 0 18px;
  background: #eef2ff; border-radius: 16px; margin-bottom: 16px;
}
.grade-card__kicker {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4px;
}
.grade-card__letter {
  font-size: 60px; font-weight: 900; color: var(--accent);
  line-height: 1; margin: 0; letter-spacing: -0.04em;
}

.metrics-strip {
  display: flex;
  border: 1px solid #e2e8f0; border-radius: 14px;
  overflow: hidden; margin-bottom: 20px;
}
.metric-col { flex: 1; padding: 16px 18px; border-right: 1px solid #e2e8f0; }
.metric-col--last { border-right: none; }
.metric-col__row  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.metric-col__label { font-size: 13.5px; font-weight: 600; color: #475569; }
.metric-col__score { font-size: 14px; font-weight: 800; color: var(--accent); }
.metric-col__track { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.metric-col__fill  { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }

.comment-list { display: flex; flex-direction: column; gap: 14px; }
.comment-item__label {
  font-size: 11.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 4px;
}
.comment-item__text { font-size: 13.5px; color: #374151; line-height: 1.7; margin: 0; white-space: pre-line; }
.comment-item--overall {
  padding: 14px 16px;
  background: #eef2ff;
  border-left: 3px solid var(--accent);
  border-radius: 0 10px 10px 0;
}
.comment-item--overall .comment-item__label { color: var(--accent); }

/* ── 챗봇 FAB ─────────────────────────────────────── */
.chat-fab {
  position: fixed; right: 32px; bottom: 32px; z-index: 60;
  width: 58px; height: 58px; border-radius: 50%; border: none;
  background: var(--accent); color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.chat-fab:hover { transform: scale(1.07); box-shadow: 0 12px 32px rgba(99, 102, 241, 0.5); }
.chat-fab svg { width: 24px; height: 24px; }

/* ── 챗봇 패널 ────────────────────────────────────── */
.chat-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 55;
  width: var(--chat-width);
  transform: translateX(100%);
  transition: transform 0.3s ease, width 0.3s ease;
  pointer-events: none;
}
.chat-panel.open { transform: translateX(0); pointer-events: auto; }

.chat-shell {
  display: flex; flex-direction: column;
  width: 100%; height: 100%;
  background: #f8fafc;
  border-left: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: -20px 0 48px rgba(15, 23, 42, 0.14);
}
.chat-header {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 14px;
  min-height: 64px; padding: 0 20px;
  background: var(--navy); color: #fff;
}
.chat-header strong { justify-self: center; font-size: 15px; font-weight: 800; }

.icon-button {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none; cursor: pointer;
  color: #fff; display: flex; align-items: center; justify-content: center;
  transition: background 0.13s;
}
.icon-button:hover { background: rgba(255,255,255,0.2); }
.icon-button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 1.8; fill: none; }

.chat-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px; padding: 18px;
}
.chat-row           { display: flex; }
.chat-row.assistant { justify-content: flex-start; }
.chat-row.user      { justify-content: flex-end; }
.chat-bubble {
  max-width: min(80%, 300px); padding: 12px 15px;
  border-radius: 16px; font-size: 13.5px; line-height: 1.7; white-space: pre-line;
}
.chat-bubble.assistant { background: #fff; color: #102033; border-top-left-radius: 4px; box-shadow: 0 2px 8px rgba(15,23,42,0.08); }
.chat-bubble.user      { background: var(--navy); color: #fff; border-top-right-radius: 4px; }

.typing-dots { display: inline-flex; align-items: center; gap: 4px; min-height: 18px; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #94a3b8; animation: bounce 1.1s infinite ease-in-out;
}
.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

.chat-composer {
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(15,23,42,0.08);
  background: rgba(255,255,255,0.9);
}
.chat-composer input {
  width: 100%; box-sizing: border-box;
  border: 1px solid rgba(15,23,42,0.12); border-radius: 12px;
  padding: 10px 14px; font-size: 13.5px; font-family: inherit;
  color: #102033; background: #fff; outline: none;
  transition: border-color 0.15s;
}
.chat-composer input:focus { border-color: var(--accent); }
.chat-composer button {
  padding: 0 18px; border-radius: 12px; border: none;
  background: var(--navy); color: #fff;
  font-size: 13.5px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background 0.13s;
}
.chat-composer button:hover { background: #1e293b; }


@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.55; }
  40%            { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 1200px) {
  .lab-grid { grid-template-columns: 1fr; }
  .result-panel { min-height: auto; }
}
@media (max-width: 768px) {
  .top-bar { flex-direction: column; align-items: flex-start; }
  .two-col { grid-template-columns: 1fr; }
  .metrics-strip { flex-direction: column; }
  .metric-col { border-right: none; border-bottom: 1px solid #e2e8f0; }
  .metric-col--last { border-bottom: none; }
  .chat-fab { right: 20px; bottom: 20px; }
}
</style>
