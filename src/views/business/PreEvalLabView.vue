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

interface EvaluationHistoryItem {
  id: string
  patentName: string
  evaluatedAt: string
  evaluation: EvaluationResult
}

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
  typing?: boolean
}

const HISTORY_KEY = 'skipa_pre_eval_history'

function loadHistory(): EvaluationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as EvaluationHistoryItem[]) : []
  } catch {
    return []
  }
}

function saveHistory(items: EvaluationHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

const patentName = ref('')
const techDescription = ref('')
const claimInputs = ref([''])
const relatedBusiness = ref('')
const targetCountries = ref('')

const evaluation = ref<EvaluationResult | null>(null)
const history = ref<EvaluationHistoryItem[]>(loadHistory())
const selectedHistoryId = ref<string | null>(null)
const chatbotOpen = ref(false)
const chatbotExpanded = ref(false)
const chatInput = ref('')
const chatMessages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.',
  },
])

const chatViewport = ref<HTMLElement | null>(null)
const messageId = ref(2)
const pendingTimers = new Set<number>()

const isStartEnabled = computed(() => Boolean(patentName.value.trim() && techDescription.value.trim()))
const chatPanelWidth = computed(() => (chatbotOpen.value ? (chatbotExpanded.value ? '100vw' : '480px') : '0px'))

const historySelectValue = computed({
  get: () => selectedHistoryId.value ?? '',
  set: (v: string) => { selectedHistoryId.value = v || null },
})

const displayedEvaluation = computed<EvaluationResult | null>(() => {
  if (selectedHistoryId.value) {
    return history.value.find((item) => item.id === selectedHistoryId.value)?.evaluation ?? null
  }
  return evaluation.value
})


const gradeDescriptions: Record<Grade, string> = {
  S: '매우 우수, 적극 출원 권고',
  A: '우수, 출원 권고',
  B: '보통, 보완 후 출원 검토',
  C: '미흡, 출원 재검토 권고',
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function nextMessageId() {
  const id = messageId.value
  messageId.value += 1
  return id
}

function scrollChatToBottom() {
  const viewport = chatViewport.value
  if (viewport) {
    viewport.scrollTop = viewport.scrollHeight
  }
}

function buildMetricComment(label: string, score: number) {
  if (score >= 80) {
    return `${label} 관점에서 핵심 강점이 뚜렷합니다.\n추가 사례와 정량 지표를 보강하면 설득력이 더 높아집니다.`
  }

  if (score >= 65) {
    return `${label}는 평균 이상입니다.\n다만 청구 포인트와 차별 요소를 조금 더 정교하게 정리하면 좋습니다.`
  }

  return `${label} 보완이 필요합니다.\n권리 포인트와 적용 시나리오를 더 선명하게 정리해 주세요.`
}

function resolveIpc() {
  const source = `${techDescription.value} ${claimInputs.value.join(' ')} ${relatedBusiness.value}`.toLowerCase()

  const rules = [
    { keywords: ['영상', '이미지', '비전', '카메라', '인식', '분석'], code: 'G06T 7/00' },
    { keywords: ['통신', '네트워크', '서버', 'api', '데이터 전송'], code: 'H04L 29/08' },
    { keywords: ['의료', '진단', '헬스', '병원', '생체'], code: 'A61B 5/00' },
    { keywords: ['차량', '모빌리티', '운전', '자율주행', '교통'], code: 'B60W 50/00' },
    { keywords: ['결제', '쇼핑', '커머스', '광고', '마케팅'], code: 'G06Q 30/02' },
  ] as const

  const match = rules.find(({ keywords }) => keywords.some((keyword) => source.includes(keyword)))
  return match?.code ?? 'G06F 17/30'
}

function buildEvaluationResult(): EvaluationResult {
  const descriptionLength = techDescription.value.trim().length
  const claims = claimInputs.value.map((claim) => claim.trim()).filter(Boolean)
  const claimCount = Math.max(1, claims.length)
  const patentLength = patentName.value.trim().length
  const businessLength = relatedBusiness.value.trim().length
  const countryLength = targetCountries.value.trim().length

  const techScore = clamp(Math.round(52 + descriptionLength / 8 + claimCount * 3.5), 0, 100)
  const rightsScore = clamp(Math.round(48 + patentLength / 5 + claimCount * 6.5), 0, 100)
  const businessScore = clamp(Math.round(46 + businessLength / 6 + countryLength / 7 + claimCount * 2), 0, 100)
  const average = Math.round((techScore + rightsScore + businessScore) / 3)

  const grade: Grade = average >= 90 ? 'S' : average >= 80 ? 'A' : average >= 65 ? 'B' : 'C'

  const overallCommentMap: Record<Grade, string> = {
    S: '세 평가 영역 모두 최상위 수준입니다. 즉시 출원을 권고합니다.',
    A: '선행기술 대비 차별 포인트를 명세서에서 더 명확히 제시하면 종합 등급 상향 가능성이 있습니다.',
    B: '전반적으로 보완이 필요합니다. 청구항 범위와 기술 차별성을 강화하면 등급 개선이 기대됩니다.',
    C: '출원 전 기술 설명과 청구 범위를 전면 재검토하는 것을 권고합니다.',
  }

  return {
    ipc: resolveIpc(),
    grade,
    gradeDescription: gradeDescriptions[grade],
    overallComment: overallCommentMap[grade],
    metrics: [
      {
        key: 'tech',
        label: '기술성',
        score: techScore,
        comment: buildMetricComment('기술성', techScore),
      },
      {
        key: 'rights',
        label: '권리성',
        score: rightsScore,
        comment: buildMetricComment('권리성', rightsScore),
      },
      {
        key: 'business',
        label: '사업성',
        score: businessScore,
        comment: buildMetricComment('사업성', businessScore),
      },
    ],
  }
}

function startEvaluation() {
  if (!isStartEnabled.value) {
    return
  }

  const result = buildEvaluationResult()
  evaluation.value = result
  selectedHistoryId.value = null

  const item: EvaluationHistoryItem = {
    id: `${Date.now()}`,
    patentName: patentName.value.trim(),
    evaluatedAt: new Date().toISOString(),
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
  chatInput.value = ''
  chatbotOpen.value = false
  chatbotExpanded.value = false
  chatMessages.value = [
    {
      id: 1,
      role: 'assistant',
      text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.',
    },
  ]

  pendingTimers.forEach((timerId) => window.clearTimeout(timerId))
  pendingTimers.clear()
  messageId.value = 2
}

function addClaimInput() {
  claimInputs.value.push('')
}

function removeClaimInput(index: number) {
  if (claimInputs.value.length <= 1) {
    claimInputs.value = ['']
    return
  }

  claimInputs.value.splice(index, 1)
}

async function toggleChatbot() {
  chatbotOpen.value = !chatbotOpen.value

  if (!chatbotOpen.value) {
    chatbotExpanded.value = false
    return
  }

  await nextTick()
  scrollChatToBottom()
}

function closeChatbot() {
  chatbotOpen.value = false
  chatbotExpanded.value = false
}

async function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text) {
    return
  }

  if (!chatbotOpen.value) {
    chatbotOpen.value = true
    await nextTick()
  }

  chatMessages.value.push({
    id: nextMessageId(),
    role: 'user',
    text,
  })

  chatInput.value = ''

  const typingMessageId = nextMessageId()
  chatMessages.value.push({
    id: typingMessageId,
    role: 'assistant',
    text: '',
    typing: true,
  })

  await nextTick()
  scrollChatToBottom()

  const timerId = window.setTimeout(() => {
    const index = chatMessages.value.findIndex((message) => message.id === typingMessageId)
    if (index !== -1) {
      chatMessages.value.splice(index, 1, {
        id: nextMessageId(),
        role: 'assistant',
        text: '해당 특허의 평가 결과를 분석한 결과, 기술적 독창성이 높게 평가되었습니다. 추가적으로 궁금한 점이 있으시면 질문해주세요.',
      })
    }

    pendingTimers.delete(timerId)
    void nextTick(() => {
      scrollChatToBottom()
    })
  }, 1000)

  pendingTimers.add(timerId)
}

function handleChatKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void sendChatMessage()
  }
}


onBeforeUnmount(() => {
  pendingTimers.forEach((timerId) => window.clearTimeout(timerId))
  pendingTimers.clear()
})
</script>

<template>
  <div class="lab-page" :style="{ '--chat-width': chatPanelWidth }">

    <!-- ── 상단 이력 바 ── -->
    <div class="history-bar">
      <div class="history-bar__left">
        <p class="history-bar__title">이전 평가 이력</p>
        <p class="history-bar__sub">저장된 평가 결과를 선택해 다시 불러올 수 있습니다.</p>
      </div>
      <div class="history-bar__right">
        <select v-if="history.length > 0" v-model="historySelectValue" class="history-select">
          <option value="">— 이력 선택 —</option>
          <option v-for="item in history" :key="item.id" :value="item.id">
            {{ item.patentName }} · {{ item.evaluatedAt.slice(0, 10) }} · {{ item.evaluation.grade }}
          </option>
        </select>
        <button class="btn-outline" type="button" @click="resetAssessment">+ 새 평가 시작</button>
      </div>
    </div>

    <div class="lab-shell">
      <main class="lab-grid">

        <!-- ── 발명 정보 입력 ── -->
        <section class="panel form-panel">
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
              <span class="field__label">청구항</span>
              <div class="claim-list">
                <div v-for="(_, index) in claimInputs" :key="index" class="claim-row">
                  <textarea
                    v-model="claimInputs[index]"
                    class="claim-textarea"
                    rows="2"
                    placeholder="청구항 내용을 입력하세요."
                  />
                  <button
                    class="claim-btn"
                    type="button"
                    @click="index === claimInputs.length - 1 ? addClaimInput() : removeClaimInput(index)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <template v-if="index === claimInputs.length - 1">
                        <path d="M12 5v14M5 12h14" />
                      </template>
                      <template v-else>
                        <path d="M18 6 6 18M6 6l12 12" />
                      </template>
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
        </section>

        <!-- ── 평가 결과 ── -->
        <section class="panel result-panel">
          <div v-if="!displayedEvaluation" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 64 64" fill="none">
                <rect x="10" y="10" width="44" height="44" rx="14" />
                <path d="M22 28.5L31.2 20l4.8 5.2L42.5 20 50 27.3V42a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V29l8-8.5 4 4z" />
                <path d="M18 39.5h28" />
              </svg>
            </div>
            <p>발명 정보를 입력하고 평가를 시작하면<br />결과가 여기에 표시됩니다.</p>
          </div>

          <template v-else>
            <!-- IPC -->
            <div class="ipc-row">
              <span class="ipc-row__label">AI 자동 분류 IPC</span>
              <strong class="ipc-row__code">{{ displayedEvaluation.ipc }}</strong>
            </div>

            <!-- 종합 등급 -->
            <div class="grade-card">
              <p class="grade-card__kicker">종합 등급</p>
              <p class="grade-card__letter">{{ displayedEvaluation.grade }}</p>
            </div>

            <!-- 3대 지표 가로 배치 -->
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
                  <div class="metric-col__fill" :style="{ width: metric.score + '%' }" />
                </div>
              </div>
            </div>

            <!-- 코멘트 -->
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
    </div>

    <!-- 챗봇 FAB -->
    <button v-if="!chatbotOpen" class="chat-fab" type="button" aria-label="AI 챗봇에게 질문하기" @click="toggleChatbot">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>

    <!-- 챗봇 패널 -->
    <aside class="chat-panel" :class="{ open: chatbotOpen, expanded: chatbotExpanded }">
      <div class="chat-shell">
        <header class="chat-header">
          <button class="icon-button" type="button" @click="chatbotExpanded = !chatbotExpanded">
            <svg v-if="!chatbotExpanded" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 9V5h4M19 15v4h-4M5 15v4h4M19 9V5h-4" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 10V6h4M10 14v4H6M10 10 6 6M18 18l-4-4" />
            </svg>
          </button>
          <strong>SKIPA AI</strong>
          <button class="icon-button" type="button" @click="closeChatbot">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div ref="chatViewport" class="chat-body">
          <div v-for="message in chatMessages" :key="message.id" class="chat-row" :class="message.role">
            <div class="chat-bubble" :class="message.role">
              <template v-if="message.typing">
                <span class="typing-dots"><span /><span /><span /></span>
              </template>
              <template v-else>{{ message.text }}</template>
            </div>
          </div>
        </div>

        <form class="chat-composer" @submit.prevent="sendChatMessage">
          <input v-model="chatInput" type="text" placeholder="평가 결과에 대해 질문해 보세요." @keydown="handleChatKeydown" />
          <button type="submit">전송</button>
        </form>
      </div>
    </aside>

  </div>
</template>

<style scoped>
.lab-page {
  --accent: #10b981;
  --accent-hover: #059669;
  --accent-soft: rgba(16, 185, 129, 0.12);
  --navy: #0f172a;
  position: relative;
  min-height: calc(100vh - 64px);
  overflow-x: hidden;
  background: #f5f4f0;
  font-family: 'Pretendard', sans-serif;
}

/* ── 레이아웃 ─────────────────────────────────────── */
.lab-shell {
  padding-right: var(--chat-width);
  transition: padding-right 0.3s ease;
}

.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 40%) minmax(0, 60%);
  gap: 20px;
  align-items: start;
}

/* ── 이력 바 ──────────────────────────────────────── */
.history-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 20px;
}
.history-bar__title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.history-bar__sub   { font-size: 12px; color: #94a3b8; margin: 0; }
.history-bar__right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.history-select {
  height: 38px; padding: 0 12px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  background: #fff; font-size: 13px; color: #0f172a;
  min-width: 260px; cursor: pointer; outline: none; font-family: inherit;
  transition: border-color .15s;
}
.history-select:focus { border-color: var(--accent); }

.btn-outline {
  height: 38px; padding: 0 16px;
  border: 1.5px solid var(--accent); border-radius: 10px;
  background: #fff; color: var(--accent);
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  transition: background .15s, color .15s;
}
.btn-outline:hover { background: var(--accent); color: #fff; }

/* ── 패널 공통 ────────────────────────────────────── */
.panel {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
}
.form-panel   { padding: 28px 24px; }
.result-panel { padding: 28px 24px; min-height: 640px; }

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
  transition: border-color .15s, box-shadow .15s;
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

.claim-group { display: flex; flex-direction: column; gap: 8px; }
.claim-list  { display: flex; flex-direction: column; gap: 8px; }
.claim-row   { display: flex; align-items: flex-start; gap: 8px; }
.claim-textarea { min-height: 64px; resize: vertical; }

.claim-btn {
  flex-shrink: 0; width: 34px; height: 34px; margin-top: 1px;
  border: 1.5px solid #e2e8f0; border-radius: 9px;
  background: #f8fafc; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; transition: border-color .13s, color .13s, background .13s;
}
.claim-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.claim-btn svg { width: 16px; height: 16px; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.btn-primary {
  width: 100%; height: 50px; border: none; border-radius: 14px;
  background: var(--accent); color: #fff;
  font-size: 15px; font-weight: 800; font-family: inherit; cursor: pointer;
  box-shadow: 0 6px 20px rgba(16, 185, 129, .28);
  transition: transform .15s, box-shadow .15s, background .15s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 10px 28px rgba(16, 185, 129, .38);
  transform: translateY(-1px);
}
.btn-primary:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }

/* ── 결과 패널 ────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 560px; gap: 16px;
  color: #94a3b8; text-align: center;
}
.empty-icon {
  width: 80px; height: 80px; border-radius: 24px;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
}
.empty-icon svg { width: 48px; height: 48px; stroke: #94a3b8; stroke-width: 1.5; fill: none; }
.empty-state p  { font-size: 14px; font-weight: 500; line-height: 1.75; }

.ipc-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px;
}
.ipc-row__label { font-size: 11.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
.ipc-row__code  { font-size: 16px; font-weight: 800; color: #0f172a; }

/* 종합 등급 카드 */
.grade-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 22px 0 18px;
  background: #f0fdf4; border-radius: 16px;
  margin-bottom: 16px;
}
.grade-card__kicker {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: .08em; margin: 0 0 4px;
}
.grade-card__letter {
  font-size: 60px; font-weight: 900; color: var(--accent);
  line-height: 1; margin: 0; letter-spacing: -0.04em;
}

/* 3대 지표 가로 배치 */
.metrics-strip {
  display: flex;
  border: 1px solid #e2e8f0; border-radius: 14px;
  overflow: hidden; margin-bottom: 20px;
}
.metric-col {
  flex: 1; padding: 16px 18px;
  border-right: 1px solid #e2e8f0;
}
.metric-col--last { border-right: none; }
.metric-col__row  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.metric-col__label { font-size: 13.5px; font-weight: 600; color: #475569; }
.metric-col__score { font-size: 14px; font-weight: 800; color: var(--accent); }
.metric-col__track { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.metric-col__fill  { height: 100%; background: var(--accent); border-radius: 3px; transition: width .4s ease; }

/* 코멘트 */
.comment-list { display: flex; flex-direction: column; gap: 14px; }
.comment-item__label {
  font-size: 11.5px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: .04em; margin: 0 0 4px;
}
.comment-item__text { font-size: 13.5px; color: #374151; line-height: 1.7; margin: 0; white-space: pre-line; }
.comment-item--overall {
  padding: 14px 16px;
  background: #f0fdf4;
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
  box-shadow: 0 8px 24px rgba(16, 185, 129, .4);
  transition: transform .15s, box-shadow .15s;
}
.chat-fab:hover { transform: scale(1.07); box-shadow: 0 12px 32px rgba(16, 185, 129, .5); }
.chat-fab svg { width: 24px; height: 24px; }

/* ── 챗봇 패널 ────────────────────────────────────── */
.chat-panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 55;
  width: var(--chat-width);
  transform: translateX(100%);
  transition: transform .3s ease, width .3s ease;
  pointer-events: none;
}
.chat-panel.open { transform: translateX(0); pointer-events: auto; }

.chat-shell {
  display: flex; flex-direction: column;
  width: 100%; height: 100%;
  background: #f8fafc;
  border-left: 1px solid rgba(15, 23, 42, .08);
  box-shadow: -20px 0 48px rgba(15, 23, 42, .14);
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
  background: rgba(255,255,255,.12); border: none; cursor: pointer;
  color: #fff; display: flex; align-items: center; justify-content: center;
  transition: background .13s;
}
.icon-button:hover { background: rgba(255,255,255,.2); }
.icon-button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 1.8; fill: none; }

.chat-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px; padding: 18px;
}
.chat-row             { display: flex; }
.chat-row.assistant   { justify-content: flex-start; }
.chat-row.user        { justify-content: flex-end; }
.chat-bubble {
  max-width: min(80%, 300px); padding: 12px 15px;
  border-radius: 16px; font-size: 13.5px; line-height: 1.7; white-space: pre-line;
}
.chat-bubble.assistant { background: #fff; color: #102033; border-top-left-radius: 4px; box-shadow: 0 2px 8px rgba(15,23,42,.08); }
.chat-bubble.user      { background: var(--navy); color: #fff; border-top-right-radius: 4px; }

.typing-dots { display: inline-flex; align-items: center; gap: 4px; min-height: 18px; }
.typing-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #94a3b8; animation: bounce 1.1s infinite ease-in-out;
}
.typing-dots span:nth-child(2) { animation-delay: .15s; }
.typing-dots span:nth-child(3) { animation-delay: .3s; }

.chat-composer {
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(15,23,42,.08);
  background: rgba(255,255,255,.9);
}
.chat-composer input {
  width: 100%; box-sizing: border-box;
  border: 1px solid rgba(15,23,42,.12); border-radius: 12px;
  padding: 10px 14px; font-size: 13.5px; font-family: inherit;
  color: #102033; background: #fff; outline: none;
  transition: border-color .15s;
}
.chat-composer input:focus { border-color: var(--accent); }
.chat-composer button {
  padding: 0 18px; border-radius: 12px; border: none;
  background: var(--navy); color: #fff;
  font-size: 13.5px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background .13s;
}
.chat-composer button:hover { background: #1e293b; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: .55; }
  40%            { transform: translateY(-4px); opacity: 1; }
}

@media (max-width: 1200px) {
  .lab-grid { grid-template-columns: 1fr; }
  .result-panel { min-height: auto; }
}
@media (max-width: 768px) {
  .history-bar { flex-direction: column; align-items: flex-start; }
  .two-col { grid-template-columns: 1fr; }
  .metrics-strip { flex-direction: column; }
  .metric-col { border-right: none; border-bottom: 1px solid #e2e8f0; }
  .metric-col--last { border-bottom: none; }
  .chat-fab { right: 20px; bottom: 20px; }
}
</style>
