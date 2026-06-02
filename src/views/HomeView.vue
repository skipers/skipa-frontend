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
  metrics: EvaluationMetric[]
}

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
  typing?: boolean
}

const patentName = ref('')
const techDescription = ref('')
const claimInputs = ref([''])
const relatedBusiness = ref('')
const targetCountries = ref('')

const evaluation = ref<EvaluationResult | null>(null)
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

  return {
    ipc: resolveIpc(),
    grade,
    gradeDescription: gradeDescriptions[grade],
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

  evaluation.value = buildEvaluationResult()
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

function metricTone(score: number) {
  if (score >= 80) return 'high'
  if (score >= 65) return 'medium'
  return 'low'
}

function scoreBarWidth(score: number) {
  return `${score}%`
}

onBeforeUnmount(() => {
  pendingTimers.forEach((timerId) => window.clearTimeout(timerId))
  pendingTimers.clear()
})
</script>

<template>
  <div class="lab-page" :style="{ '--chat-width': chatPanelWidth }">
    <div class="lab-shell">
      <header class="lab-header">
        <div>
          <p class="eyebrow">SKIPA</p>
          <h1>사전 평가 Lab</h1>
          <p class="subtitle">
            특허의 핵심 정보를 입력하면 AI가 IPC, 등급, 항목별 관점을 빠르게 정리합니다.
          </p>
        </div>

        <button class="header-chat-button" type="button" @click="toggleChatbot">
          {{ chatbotOpen ? '챗봇 닫기' : 'AI 챗봇에게 질문하기' }}
        </button>
      </header>

      <main class="lab-grid">
        <section class="panel form-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">입력 폼</p>
              <h2>발명 정보 입력</h2>
            </div>

            <button class="ghost-button" type="button" @click="resetAssessment">+ 새 평가 시작</button>
          </div>

          <form class="form-stack" @submit.prevent="startEvaluation">
            <label class="field">
              <span>특허명 <em>*</em></span>
              <input v-model="patentName" type="text" placeholder="예: 영상 분석 기반 위험 예측 시스템" />
            </label>

            <label class="field">
              <span>기술 설명 <em>*</em></span>
              <textarea
                v-model="techDescription"
                rows="5"
                placeholder="핵심 기술의 작동 방식, 차별점, 활용 맥락을 입력하세요."
              />
            </label>

            <div class="field-group">
              <div class="group-head">
                <span>청구항</span>
                <button class="text-button" type="button" @click="addClaimInput">+ 청구항 추가</button>
              </div>

              <div class="claim-list">
                <label v-for="(claim, index) in claimInputs" :key="index" class="field claim-field">
                  <span>청구항 {{ index + 1 }}</span>
                  <textarea
                    v-model="claimInputs[index]"
                    rows="3"
                    placeholder="청구항 내용을 입력하세요."
                  />
                </label>
              </div>
            </div>

            <label class="field">
              <span>관련 사업</span>
              <input v-model="relatedBusiness" type="text" placeholder="예: B2B SaaS, 제조, 의료기기" />
            </label>

            <label class="field">
              <span>출원 예정 국가</span>
              <input v-model="targetCountries" type="text" placeholder="예: 한국, 미국, 일본" />
            </label>

            <button class="primary-button" type="submit" :disabled="!isStartEnabled">
              평가 시작
            </button>
          </form>
        </section>

        <section class="panel result-panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">평가 결과</p>
              <h2>AI 분석 리포트</h2>
            </div>
          </div>

          <div v-if="!evaluation" class="empty-state">
            <div class="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" fill="none">
                <rect x="10" y="10" width="44" height="44" rx="14" />
                <path d="M22 28.5L31.2 20l4.8 5.2L42.5 20 50 27.3V42a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V29l8-8.5 4 4z" />
                <path d="M18 39.5h28" />
              </svg>
            </div>

            <p>
              발명 정보를 입력하고 평가를 시작하면
              <br />
              결과가 여기에 표시됩니다.
            </p>
          </div>

          <div v-else class="result-stack">
            <div class="ipc-row">
              <span class="ipc-label">AI 자동 분류 IPC</span>
              <strong>{{ evaluation.ipc }}</strong>
            </div>

            <div class="grade-card">
              <div class="grade-pill">{{ evaluation.grade }}</div>
              <div>
                <p class="grade-description">{{ evaluation.gradeDescription }}</p>
                <p class="grade-summary">
                  종합적인 기술성, 권리성, 사업성을 균형 있게 반영한 평가 결과입니다.
                </p>
              </div>
            </div>

            <div class="metric-list">
              <article v-for="metric in evaluation.metrics" :key="metric.key" class="metric-card">
                <div class="metric-top">
                  <div>
                    <p class="metric-label">{{ metric.label }}</p>
                    <strong class="metric-score">{{ metric.score }}</strong>
                  </div>
                  <span class="tone-chip" :class="metricTone(metric.score)">
                    {{ metricTone(metric.score) === 'high' ? '높음' : metricTone(metric.score) === 'medium' ? '보통' : '낮음' }}
                  </span>
                </div>

                <div class="meter" :class="metricTone(metric.score)">
                  <div class="meter-fill" :style="{ width: scoreBarWidth(metric.score) }" />
                </div>

                <p class="metric-comment">{{ metric.comment }}</p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>

    <button
      v-if="!chatbotOpen"
      class="chat-fab"
      type="button"
      aria-label="AI 챗봇에게 질문하기"
      @click="toggleChatbot"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 8.5A5.5 5.5 0 0 1 12.5 3h.5a5 5 0 0 1 5 5v4.5a5 5 0 0 1-5 5h-2l-4.5 3v-3H9A5.5 5.5 0 0 1 7 12.5V8.5Z" />
        <path d="M9 9.5h6M9 12h4" />
      </svg>
    </button>

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
                <span class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </template>
              <template v-else>
                {{ message.text }}
              </template>
            </div>
          </div>
        </div>

        <form class="chat-composer" @submit.prevent="sendChatMessage">
          <input
            v-model="chatInput"
            type="text"
            placeholder="평가 결과에 대해 질문해 보세요."
            @keydown="handleChatKeydown"
          />
          <button type="submit">전송</button>
        </form>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.lab-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at top left, rgba(18, 141, 95, 0.12), transparent 28%),
    radial-gradient(circle at 90% 8%, rgba(18, 141, 95, 0.08), transparent 24%),
    linear-gradient(180deg, #f7f4ee 0%, #f2efe8 100%);
}

.lab-page::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent 85%);
}

.lab-shell {
  min-height: 100vh;
  padding: 32px;
  padding-right: calc(32px + var(--chat-width));
  transition: padding-right 0.3s ease;
}

.lab-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.eyebrow {
  margin-bottom: 8px;
  color: rgba(15, 23, 42, 0.54);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.lab-header h1 {
  margin: 0;
  color: #102033;
  font-size: clamp(1.8rem, 2.4vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.subtitle {
  margin-top: 10px;
  max-width: 56ch;
  color: rgba(15, 23, 42, 0.68);
  font-size: 0.98rem;
}

.header-chat-button,
.ghost-button,
.text-button,
.primary-button,
.chat-composer button,
.icon-button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.header-chat-button {
  align-self: center;
  border-radius: 999px;
  padding: 0.92rem 1.2rem;
  background: rgba(255, 255, 255, 0.82);
  color: #0f5132;
  border: 1px solid rgba(18, 141, 95, 0.16);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.header-chat-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.96);
}

.lab-grid {
  display: grid;
  grid-template-columns: minmax(0, 40%) minmax(0, 60%);
  gap: 20px;
  align-items: stretch;
}

.panel {
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(18px);
}

.form-panel {
  padding: 24px;
}

.result-panel {
  padding: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 250, 247, 0.98));
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-kicker {
  margin-bottom: 8px;
  color: rgba(15, 23, 42, 0.54);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 0;
  color: #102033;
  font-size: 1.25rem;
  font-weight: 800;
}

.ghost-button,
.text-button {
  border-radius: 999px;
  background: transparent;
  color: #128d5f;
  transition: transform 0.2s ease, background 0.2s ease;
}

.ghost-button {
  padding: 0.68rem 0.95rem;
  border: 1px solid rgba(18, 141, 95, 0.14);
  background: rgba(18, 141, 95, 0.06);
}

.ghost-button:hover,
.text-button:hover,
.primary-button:hover:not(:disabled),
.chat-composer button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.form-stack {
  display: grid;
  gap: 16px;
}

.field,
.field-group {
  display: grid;
  gap: 8px;
}

.field > span,
.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #223247;
  font-size: 0.95rem;
  font-weight: 700;
}

.field em {
  color: #b42318;
  font-style: normal;
}

.field input,
.field textarea,
.chat-composer input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: #102033;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.field input,
.chat-composer input {
  min-height: 52px;
  padding: 0 16px;
}

.field textarea {
  min-height: 118px;
  padding: 14px 16px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.chat-composer input:focus {
  border-color: rgba(18, 141, 95, 0.38);
  box-shadow: 0 0 0 4px rgba(18, 141, 95, 0.08);
  background: #fff;
}

.claim-list {
  display: grid;
  gap: 12px;
}

.claim-field textarea {
  min-height: 88px;
}

.primary-button {
  min-height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  color: #fff;
  box-shadow: 0 16px 30px rgba(18, 141, 95, 0.28);
  font-weight: 800;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

.primary-button:hover:not(:disabled) {
  box-shadow: 0 20px 36px rgba(18, 141, 95, 0.36);
}

.result-panel {
  min-height: 760px;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 620px;
  gap: 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(18, 141, 95, 0.07), rgba(18, 141, 95, 0.03));
  color: rgba(15, 23, 42, 0.66);
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.empty-icon svg {
  width: 54px;
  height: 54px;
  stroke: #128d5f;
  stroke-width: 1.8;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.75;
}

.result-stack {
  display: grid;
  gap: 18px;
}

.ipc-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(18, 141, 95, 0.08);
  color: #0f5132;
}

.ipc-label {
  font-size: 0.9rem;
  font-weight: 700;
}

.ipc-row strong {
  font-size: 1.08rem;
  font-weight: 800;
}

.grade-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  align-items: center;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  color: #fff;
  box-shadow: 0 22px 42px rgba(18, 141, 95, 0.24);
}

.grade-pill {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: -0.08em;
}

.grade-description {
  margin-bottom: 8px;
  font-size: 1.25rem;
  font-weight: 800;
}

.grade-summary {
  max-width: 48ch;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.7;
}

.metric-list {
  display: grid;
  gap: 14px;
}

.metric-card {
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
}

.metric-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.metric-label {
  margin-bottom: 4px;
  color: rgba(15, 23, 42, 0.58);
  font-size: 0.86rem;
  font-weight: 700;
}

.metric-score {
  color: #102033;
  font-size: 1.55rem;
  font-weight: 900;
}

.tone-chip {
  border-radius: 999px;
  padding: 0.52rem 0.82rem;
  font-size: 0.82rem;
  font-weight: 800;
}

.tone-chip.high {
  background: rgba(18, 141, 95, 0.14);
  color: #0f5132;
}

.tone-chip.medium {
  background: rgba(217, 119, 6, 0.14);
  color: #92400e;
}

.tone-chip.low {
  background: rgba(185, 28, 28, 0.12);
  color: #991b1b;
}

.meter {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.meter-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease;
}

.meter.high .meter-fill {
  background: linear-gradient(90deg, #18b56f, #128d5f);
}

.meter.medium .meter-fill {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.meter.low .meter-fill {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.metric-comment {
  margin-top: 12px;
  color: rgba(15, 23, 42, 0.72);
  line-height: 1.7;
  white-space: pre-line;
}

.chat-fab {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 60;
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border-radius: 999px;
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  box-shadow: 0 20px 40px rgba(18, 141, 95, 0.32);
  color: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-fab:hover {
  transform: scale(1.06);
  box-shadow: 0 24px 48px rgba(18, 141, 95, 0.38);
}

.chat-fab svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 1.8;
}

.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 55;
  width: var(--chat-width);
  transform: translateX(100%);
  transition:
    transform 0.3s ease,
    width 0.3s ease;
  pointer-events: none;
}

.chat-panel.open {
  transform: translateX(0);
  pointer-events: auto;
}

.chat-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f7f4ee;
  border-left: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: -24px 0 52px rgba(15, 23, 42, 0.18);
}

.chat-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  min-height: 72px;
  padding: 0 20px;
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  color: #fff;
}

.chat-header strong {
  justify-self: center;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: inherit;
  transition: transform 0.2s ease, background 0.2s ease;
}

.icon-button:hover {
  transform: scale(1.06);
  background: rgba(255, 255, 255, 0.2);
}

.icon-button svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.8;
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  padding: 20px;
}

.chat-row {
  display: flex;
}

.chat-row.assistant {
  justify-content: flex-start;
}

.chat-row.user {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: min(82%, 320px);
  padding: 13px 16px;
  border-radius: 18px;
  line-height: 1.7;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  white-space: pre-line;
}

.chat-bubble.assistant {
  background: rgba(255, 255, 255, 0.92);
  color: #102033;
  border-top-left-radius: 6px;
}

.chat-bubble.user {
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  color: #fff;
  border-top-right-radius: 6px;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 20px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #128d5f;
  animation: bounce 1.1s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

.chat-composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 18px 20px 22px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.85);
}

.chat-composer button {
  min-width: 88px;
  border-radius: 16px;
  background: linear-gradient(135deg, #128d5f, #0f7a50);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 16px 30px rgba(18, 141, 95, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.chat-composer button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }

  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .lab-grid {
    grid-template-columns: 1fr;
  }

  .result-panel {
    min-height: auto;
  }

  .empty-state {
    min-height: 360px;
  }
}

@media (max-width: 1024px) {
  .lab-shell {
    padding: 24px;
    padding-right: calc(24px + var(--chat-width));
  }

  .lab-header {
    flex-direction: column;
  }

  .header-chat-button {
    align-self: flex-start;
  }
}

@media (max-width: 720px) {
  .lab-shell {
    padding: 18px;
    padding-right: calc(18px + var(--chat-width));
  }

  .form-panel,
  .result-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .panel-head,
  .metric-top,
  .grade-card {
    grid-template-columns: 1fr;
  }

  .grade-card {
    justify-items: start;
  }

  .chat-panel {
    width: min(100vw, var(--chat-width));
  }

  .chat-fab {
    right: 20px;
    bottom: 20px;
  }

  .chat-bubble {
    max-width: 88%;
  }
}
</style>
