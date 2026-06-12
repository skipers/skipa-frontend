<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { preEvaluationsApi } from '@/api/preEvaluations'
import type { PreEvaluationListItem, PreEvaluationDetailResponse } from '@/api/preEvaluations'

type Grade = string
type ChatRole = 'assistant' | 'user'

interface EvaluationMetric {
  key: string
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

interface ChatMessage {
  id: number
  role: ChatRole
  text: string
  typing?: boolean
}

const GREETING = '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.'

const gradeDescriptions: Record<string, string> = {
  S:   '매우 우수, 적극 출원 권고',
  'A+': '우수, 출원 권고',
  A:   '우수, 출원 권고',
  'B+': '보통 이상, 출원 검토',
  B:   '보통, 보완 후 출원 검토',
  'C+': '미흡, 보완 필요',
  C:   '미흡, 출원 재검토 권고',
  D:   '불량, 전면 재검토 권고',
}

// ── 입력 폼 ──────────────────────────────────────────
const patentName      = ref('')
const techDescription = ref('')
const claimInputs     = ref([''])
const relatedBusiness = ref('')
const targetCountries = ref('')

// ── 상태 ─────────────────────────────────────────────
const historyList         = ref<PreEvaluationListItem[]>([])
const gradeCache          = ref<Record<number, string>>({})
const selectedHistoryId   = ref<number | null>(null)
const selectedDetail      = ref<PreEvaluationDetailResponse | null>(null)
const evaluationResult    = ref<EvaluationResult | null>(null)
const historyDropdownOpen = ref(false)
const isEvaluating        = ref(false)

const chatbotOpen     = ref(false)
const chatbotExpanded = ref(false)
const chatInput       = ref('')
const chatMessages    = ref<ChatMessage[]>([])
const chatSending     = ref(false)

const chatViewport = ref<HTMLElement | null>(null)
let   _msgId       = 1000
let   _isStarting  = false  // non-reactive guard against double-submission

const pollingTimer = ref<number | null>(null)

// ── computed ──────────────────────────────────────────
const isStartEnabled = computed(() =>
  Boolean(patentName.value.trim() && techDescription.value.trim()) && !isEvaluating.value
)

const chatPanelWidth = computed(() =>
  chatbotOpen.value ? (chatbotExpanded.value ? '100vw' : '480px') : '0px'
)

// ── 유틸 ─────────────────────────────────────────────
function nextMsgId() { return _msgId++ }

function formatDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, '.')
}

function scrollChatToBottom() {
  if (chatViewport.value) chatViewport.value.scrollTop = chatViewport.value.scrollHeight
}

// ── 이력 ─────────────────────────────────────────────
async function fetchHistory() {
  try {
    const res = await preEvaluationsApi.getList({ size: 100 })
    historyList.value = res.items ?? []
  } catch {
    historyList.value = []
  }
}

// ── 보고서 URL 파싱 ───────────────────────────────────
async function parseReportUrl(reportUrl: string): Promise<EvaluationResult | null> {
  try {
    const res = await fetch(reportUrl)
    if (!res.ok) return null
    const json = await res.json()

    // frontend_summary가 있으면 우선 사용
    const fs  = json.frontend_summary
    const es  = json.executive_summary

    const grade: string | undefined = fs?.overall_grade ?? es?.grade
    if (!grade) return null

    const ipc: string =
      fs?.ipc ?? json.ai_classification?.ipc ?? json.input_summary?.estimated_ipc?.ipc ?? ''

    // dimensions 배열에서 메트릭 구성
    const metrics: EvaluationMetric[] = (json.dimensions ?? []).map((d: Record<string, unknown>) => {
      const items = (d.items ?? []) as Array<Record<string, unknown>>
      const comment = items.map(i => String(i.reason ?? '')).filter(Boolean).join('\n')
      return {
        key:   String(d.key),
        label: String(d.label),
        score: Number(d.score_out_of_100 ?? 0),
        comment,
      }
    })

    return {
      ipc,
      grade,
      gradeDescription: gradeDescriptions[grade] ?? '',
      overallComment: String(es?.opinion ?? ''),
      metrics,
    }
  } catch {
    return null
  }
}

// ── 이력 선택 ─────────────────────────────────────────
async function selectHistory(id: number) {
  selectedHistoryId.value = id
  evaluationResult.value = null
  selectedDetail.value = null
  chatMessages.value = []

  try {
    const detail = await preEvaluationsApi.getDetail(id)
    selectedDetail.value = detail

    if (detail.status === 'REPORT_COMPLETED' && detail.reportUrl) {
      const result = await parseReportUrl(detail.reportUrl)
      evaluationResult.value = result
      if (result) gradeCache.value[id] = result.grade
    }

    await loadChatHistory(id)
  } catch {
    chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text: GREETING }]
  }
}

function selectHistoryFromDropdown(id: number) {
  void selectHistory(id)
  historyDropdownOpen.value = false
}

async function loadChatHistory(id: number) {
  try {
    const messages = await preEvaluationsApi.getChatHistory(id)
    if (messages.length === 0) {
      const item = historyList.value.find(h => h.id === id)
      const text = item
        ? `'${item.title}' 평가 결과를 불러왔습니다. 궁금한 점을 질문해주세요.`
        : GREETING
      chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text }]
    } else {
      chatMessages.value = messages.map(m => ({
        id: nextMsgId(),
        role: m.role as ChatRole,
        text: m.content,
      }))
    }
  } catch {
    chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text: GREETING }]
  }
}

// ── 평가 생성 ─────────────────────────────────────────
async function startEvaluation() {
  if (!isStartEnabled.value || _isStarting) return
  _isStarting = true
  isEvaluating.value = true
  evaluationResult.value = null
  selectedDetail.value = null
  selectedHistoryId.value = null
  chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text: GREETING }]

  try {
    const created = await preEvaluationsApi.create({
      title: patentName.value.trim(),
      technicalDescription: techDescription.value.trim(),
      claims: claimInputs.value.map(c => c.trim()).filter(Boolean),
      relatedBusiness: relatedBusiness.value.trim() || undefined,
      targetCountries: targetCountries.value.trim() || undefined,
    })
    await pollStatus(created.id)
  } catch {
    isEvaluating.value = false
  } finally {
    _isStarting = false
  }
}

async function pollStatus(id: number) {
  try {
    const detail = await preEvaluationsApi.getDetail(id)

    if (detail.status === 'REPORT_COMPLETED') {
      selectedDetail.value = detail
      selectedHistoryId.value = id
      await fetchHistory()
      if (detail.reportUrl) {
        const result = await parseReportUrl(detail.reportUrl)
        evaluationResult.value = result
        if (result) gradeCache.value[id] = result.grade
      }
      await loadChatHistory(id)
      isEvaluating.value = false
    } else if (detail.status === 'FAILED') {
      isEvaluating.value = false
    } else {
      pollingTimer.value = window.setTimeout(() => void pollStatus(id), 3000)
    }
  } catch {
    pollingTimer.value = window.setTimeout(() => void pollStatus(id), 5000)
  }
}

// ── 새 평가 초기화 ────────────────────────────────────
function resetAssessment() {
  patentName.value = ''
  techDescription.value = ''
  claimInputs.value = ['']
  relatedBusiness.value = ''
  targetCountries.value = ''
  evaluationResult.value = null
  selectedDetail.value = null
  selectedHistoryId.value = null
  historyDropdownOpen.value = false
  chatInput.value = ''
  chatbotOpen.value = false
  chatbotExpanded.value = false
  isEvaluating.value = false
  if (pollingTimer.value) { window.clearTimeout(pollingTimer.value); pollingTimer.value = null }
  chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text: GREETING }]
}

function addClaimInput() { claimInputs.value.push('') }
function removeClaimInput(i: number) {
  if (claimInputs.value.length <= 1) { claimInputs.value = ['']; return }
  claimInputs.value.splice(i, 1)
}

// ── 챗봇 ──────────────────────────────────────────────
async function toggleChatbot() {
  chatbotOpen.value = !chatbotOpen.value
  if (!chatbotOpen.value) { chatbotExpanded.value = false; return }
  await nextTick()
  scrollChatToBottom()
}
function closeChatbot() { chatbotOpen.value = false; chatbotExpanded.value = false }

async function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text || chatSending.value || selectedHistoryId.value === null) return
  if (!chatbotOpen.value) { chatbotOpen.value = true; await nextTick() }

  chatMessages.value.push({ id: nextMsgId(), role: 'user', text })
  chatInput.value = ''

  const typingId = nextMsgId()
  chatMessages.value.push({ id: typingId, role: 'assistant', text: '', typing: true })
  await nextTick()
  scrollChatToBottom()

  chatSending.value = true
  try {
    const res = await preEvaluationsApi.sendChatMessage(selectedHistoryId.value, text)
    const idx = chatMessages.value.findIndex(m => m.id === typingId)
    if (idx !== -1) {
      chatMessages.value.splice(idx, 1, {
        id: nextMsgId(),
        role: 'assistant',
        text: res.assistantMessage.content,
      })
    }
  } catch {
    const idx = chatMessages.value.findIndex(m => m.id === typingId)
    if (idx !== -1) {
      chatMessages.value.splice(idx, 1, {
        id: nextMsgId(),
        role: 'assistant',
        text: '답변을 불러오는 데 실패했습니다. 다시 시도해주세요.',
      })
    }
  } finally {
    chatSending.value = false
    void nextTick(() => scrollChatToBottom())
  }
}

function handleChatKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendChatMessage() }
}

onMounted(async () => {
  chatMessages.value = [{ id: nextMsgId(), role: 'assistant', text: GREETING }]
  await fetchHistory()
})

onBeforeUnmount(() => {
  if (pollingTimer.value) window.clearTimeout(pollingTimer.value)
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
          <p class="top-bar__title">사전 평가 Lab</p>
          <p class="top-bar__sub">출원 전 발명을 AI로 사전 진단합니다.</p>
        </div>

        <div class="top-bar__actions">
          <button class="btn-new-eval" type="button" @click="resetAssessment">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            새 평가
          </button>

        <!-- 평가 이력 드롭다운 -->
        <div class="history-dropdown" :class="{ 'history-dropdown--open': historyDropdownOpen }">
          <button class="btn-history" type="button" @click="historyDropdownOpen = !historyDropdownOpen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            평가 이력
            <span class="history-count">{{ historyList.length }}</span>
            <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          <div class="history-dropdown__menu">
            <ul class="dropdown-list">
              <li v-if="!historyList.length" class="dropdown-empty">평가 이력이 없습니다.</li>
              <li
                v-for="item in historyList"
                :key="item.id"
                class="dropdown-item"
                :class="{ 'dropdown-item--active': selectedHistoryId === item.id }"
                @click="selectHistoryFromDropdown(item.id)"
              >
                <p class="dropdown-item__name">{{ item.title }}</p>
                <div class="dropdown-item__meta">
                  <span class="dropdown-item__date">{{ formatDate(item.completedAt ?? item.createdAt) }}</span>
                  <span v-if="gradeCache[item.id]" class="grade-pill" :class="`grade-pill--${gradeCache[item.id].charAt(0).toLowerCase()}`">
                    {{ gradeCache[item.id] }}
                  </span>
                  <span v-else-if="item.status === 'COMPLETED'" class="status-pill status-pill--completed">완료</span>
                  <span v-else-if="item.status === 'PROCESSING' || item.status === 'PENDING'" class="status-pill status-pill--pending">평가 중</span>
                  <span v-else class="status-pill">{{ item.status }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div><!-- /history-dropdown -->
        </div><!-- /top-bar__actions -->

      </div>

      <!-- 드롭다운 외부 클릭 닫기 -->
      <div v-if="historyDropdownOpen" class="dropdown-backdrop" @click="historyDropdownOpen = false" />

      <!-- 2열 그리드 -->
      <main class="lab-grid">

        <!-- 입력폼 -->
        <section class="panel form-panel">
          <!-- 읽기 전용 뷰 (이력 선택 시) -->
          <template v-if="selectedDetail">
            <div class="readonly-header">
              <h2 class="panel-title readonly-panel-title">{{ selectedDetail.title }}</h2>
              <p class="readonly-date">평가일 {{ formatDate(selectedDetail.completedAt ?? selectedDetail.createdAt) }}</p>
            </div>

            <div class="readonly-fields">
              <div class="readonly-field">
                <p class="readonly-field__label">특허명</p>
                <p class="readonly-field__value">{{ selectedDetail.title || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">기술 설명</p>
                <p class="readonly-field__value">{{ selectedDetail.technicalDescription || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">청구항</p>
                <div v-if="selectedDetail.claims.length" class="readonly-field__value readonly-field__value--claims">
                  <ol class="readonly-claim-list">
                    <li v-for="(claim, i) in selectedDetail.claims" :key="i">{{ claim }}</li>
                  </ol>
                </div>
                <p v-else class="readonly-field__value readonly-field__value--empty">-</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">관련 사업</p>
                <p class="readonly-field__value">{{ selectedDetail.relatedBusiness || '-' }}</p>
              </div>
              <div class="readonly-field">
                <p class="readonly-field__label">출원 예정 국가</p>
                <p class="readonly-field__value">{{ selectedDetail.targetCountries || '-' }}</p>
              </div>
            </div>
          </template>

          <!-- 평가 진행 중 -->
          <template v-else-if="isEvaluating">
            <h2 class="panel-title">AI 평가 중</h2>
            <div class="evaluating-info">
              <div class="spinner"></div>
              <p class="evaluating-text">발명 내용을 분석하고 있습니다.<br/>잠시만 기다려주세요.</p>
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
          <div v-if="isEvaluating" class="empty-state">
            <div class="spinner spinner--large"></div>
            <p>AI가 발명을 분석하고 있습니다…</p>
          </div>

          <div v-else-if="!evaluationResult" class="empty-state">
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
              <strong class="ipc-row__code">{{ evaluationResult.ipc }}</strong>
            </div>

            <div class="grade-card">
              <p class="grade-card__kicker">종합 등급</p>
              <p class="grade-card__letter">{{ evaluationResult.grade }}</p>
            </div>

            <div class="metrics-strip">
              <div
                v-for="(metric, i) in evaluationResult.metrics"
                :key="metric.key"
                class="metric-col"
                :class="{ 'metric-col--last': i === evaluationResult.metrics.length - 1 }"
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
              <div v-for="metric in evaluationResult.metrics" :key="metric.key + '-c'" class="comment-item">
                <p class="comment-item__label">{{ metric.label }} 코멘트</p>
                <p class="comment-item__text">{{ metric.comment }}</p>
              </div>
              <div class="comment-item comment-item--overall">
                <p class="comment-item__label">종합 코멘트</p>
                <p class="comment-item__text">{{ evaluationResult.overallComment }}</p>
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
          <button type="submit" :disabled="chatSending || selectedHistoryId === null">전송</button>
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

/* 상태 뱃지 */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: #f1f5f9;
  color: #475569;
}
.status-pill--completed { background: #dcfce7; color: #14532d; }
.status-pill--pending   { background: #fff7ed; color: #92400e; }

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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.top-bar__left { flex: 1; min-width: 0; }
.top-bar__actions {
  display: flex; align-items: center; gap: 8px; position: relative; flex-shrink: 0;
}
.top-bar__title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.02em; }
.top-bar__sub   { font-size: 13.5px; color: #94a3b8; margin: 0; }
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
  right: 0;
  left: auto;
  width: 300px;
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
  max-height: 320px; overflow-y: auto;
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

/* ── 평가 진행 중 ─────────────────────────────────── */
.evaluating-info {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex: 1; gap: 20px; padding: 32px 0;
}
.evaluating-text {
  font-size: 14px; color: #64748b;
  text-align: center; line-height: 1.75; margin: 0;
}

/* ── 스피너 ───────────────────────────────────────── */
.spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
  flex-shrink: 0;
}
.spinner--large { width: 44px; height: 44px; }

@keyframes spin { to { transform: rotate(360deg); } }

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
.chat-composer button:hover:not(:disabled) { background: #1e293b; }
.chat-composer button:disabled { background: #94a3b8; cursor: not-allowed; }


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
