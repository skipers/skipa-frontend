<template>
  <div class="lab-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div>
        <p class="page-header__eyebrow">사전 평가 Lab</p>
        <h2 class="page-header__title">특허 가치 사전 평가</h2>
        <p class="page-header__desc">특허 정보를 입력하거나 PDF를 업로드하면 AI가 즉시 가치를 평가합니다</p>
      </div>
      <button v-if="messages.length > 0" class="btn-new-chat" @click="resetChat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        새 평가 시작
      </button>
    </div>

    <div class="lab-layout">

      <!-- 좌: 대화 내역 사이드바 -->
      <aside class="history-sidebar">
        <p class="history-sidebar__title">평가 이력</p>
        <div v-if="chatHistory.length" class="history-list">
          <div
            v-for="(h, i) in chatHistory"
            :key="h.id"
            class="history-item"
            :class="{ 'history-item--active': activeChatId === h.id }"
            @click="loadChat(h)"
          >
            <div class="history-item__icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="history-item__info">
              <p class="history-item__title">{{ h.title }}</p>
              <p class="history-item__date">{{ h.date }}</p>
            </div>
            <button class="history-item__del" @click.stop="deleteChat(i)" title="삭제">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div v-else class="history-empty">
          <p>아직 평가 이력이 없습니다</p>
        </div>
      </aside>

      <!-- 우: 메인 채팅 영역 -->
      <div class="chat-area">

        <!-- 초기 상태 (메시지 없을 때) -->
        <template v-if="!messages.length">
          <div class="chat-welcome">
            <div class="chat-welcome__icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 14 L14 4 L24 14" stroke="#6366f1" stroke-width="2" stroke-linejoin="round" fill="none"/>
                <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="#6366f1" opacity="0.7"/>
                <circle cx="14" cy="14" r="2.5" fill="#6366f1"/>
              </svg>
            </div>
            <h3 class="chat-welcome__title">SKIPA 사전 평가 Lab</h3>
            <p class="chat-welcome__desc">특허 정보를 입력하거나 PDF를 업로드하면<br/>AI가 기술성·권리성·사업성을 자동으로 평가합니다</p>

            <!-- 빠른 시작 카드 -->
            <div class="quick-start">
              <div
                v-for="q in quickStarts"
                :key="q.text"
                class="quick-start-card"
                @click="sendMessage(q.text)"
              >
                <span class="quick-start-card__emoji">{{ q.emoji }}</span>
                <span>{{ q.text }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 메시지 목록 -->
        <div v-else class="messages-wrap" ref="messagesEl">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message"
            :class="`message--${msg.role}`"
          >
            <!-- AI 아이콘 -->
            <div v-if="msg.role === 'assistant'" class="message__avatar">
              <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                <path d="M4 14 L14 4 L24 14" stroke="white" stroke-width="2" stroke-linejoin="round" fill="none"/>
                <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="white" opacity="0.8"/>
              </svg>
            </div>

            <div class="message__bubble">
              <!-- 파일 첨부 표시 -->
              <div v-if="msg.file" class="message__file">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {{ msg.file }}
              </div>
              <!-- 텍스트 -->
              <div class="message__text" v-html="renderText(msg.content)" />
              <!-- 평가 결과 카드 -->
              <div v-if="msg.evaluation" class="eval-card">
                <p class="eval-card__title">AI 평가 결과</p>
                <div class="eval-scores">
                  <div v-for="s in msg.evaluation" :key="s.label" class="eval-score">
                    <div class="eval-score__label">{{ s.label }}</div>
                    <div class="eval-score__bar-wrap">
                      <div class="eval-score__bar" :style="{ width: s.score * 10 + '%', background: s.color }" />
                    </div>
                    <div class="eval-score__value" :style="{ color: s.color }">{{ s.score }}/10</div>
                  </div>
                </div>
              </div>
              <p class="message__time">{{ msg.time }}</p>
            </div>
          </div>

          <!-- AI 타이핑 -->
          <div v-if="aiTyping" class="message message--assistant">
            <div class="message__avatar">
              <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                <path d="M4 14 L14 4 L24 14" stroke="white" stroke-width="2" stroke-linejoin="round" fill="none"/>
                <path d="M8 18 L14 12 L20 18 L14 24 Z" fill="white" opacity="0.8"/>
              </svg>
            </div>
            <div class="message__bubble">
              <div class="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>

        <!-- 입력 영역 -->
        <div class="input-area">
          <!-- 업로드된 파일 미리보기 -->
          <Transition name="slide-up">
            <div v-if="attachedFile" class="attached-file">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>{{ attachedFile.name }}</span>
              <button @click="attachedFile = null">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </Transition>

          <div class="input-box" :class="{ 'input-box--focused': inputFocused }">
            <!-- 파일 첨부 버튼 -->
            <button class="input-attach" @click="fileInputEl?.click()" title="PDF 첨부">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <input type="file" accept=".pdf" ref="fileInputEl" style="display:none" @change="handleFileAttach" />

            <textarea
              v-model="inputText"
              class="input-textarea"
              placeholder="특허명, 기술 내용, 청구항 등을 입력하거나 PDF를 첨부하세요"
              rows="1"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
              @keydown.enter.exact.prevent="handleSend"
              @input="autoResize"
              ref="textareaEl"
            />

            <button
              class="input-send"
              :disabled="(!inputText.trim() && !attachedFile) || aiTyping"
              @click="handleSend"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            </button>
          </div>
          <p class="input-hint">Enter로 전송 · Shift+Enter 줄바꿈</p>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, reactive } from 'vue'

// ── 타입 ────────────────────────────────────────────
interface EvalScore { label: string; score: number; color: string }
interface Message {
  id: string; role: 'user' | 'assistant'
  content: string; time: string
  file?: string
  evaluation?: EvalScore[]
}
interface ChatRecord { id: string; title: string; date: string; messages: Message[] }

// ── 상태 ────────────────────────────────────────────
const messages     = ref<Message[]>([])
const aiTyping     = ref(false)
const inputText    = ref('')
const inputFocused = ref(false)
const attachedFile = ref<File | null>(null)
const activeChatId = ref<string | null>(null)
const chatHistory  = ref<ChatRecord[]>(loadHistory())

const messagesEl  = ref<HTMLElement | null>(null)
const textareaEl  = ref<HTMLTextAreaElement | null>(null)
const fileInputEl = ref<HTMLInputElement | null>(null)

// ── 빠른 시작 ────────────────────────────────────────
const quickStarts = [
  { emoji: '🔬', text: '반도체 공정 관련 특허를 평가해주세요' },
  { emoji: '⚡', text: '배터리 기술 특허의 가치를 분석해주세요' },
  { emoji: '🤖', text: 'AI/ML 특허의 사업 활용 가능성을 검토해주세요' },
  { emoji: '📄', text: 'PDF 업로드로 특허 원문을 바로 분석해주세요' },
]

// ── 메시지 전송 ──────────────────────────────────────
async function handleSend() {
  const text = inputText.value.trim()
  const file = attachedFile.value
  if (!text && !file) return
  await sendMessage(text, file ?? undefined)
}

async function sendMessage(text: string, file?: File) {
  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: text || (file ? `${file.name} 파일을 업로드했습니다. 특허 가치를 평가해주세요.` : ''),
    time: nowStr(),
    file: file?.name,
  }
  messages.value.push(userMsg)
  inputText.value = ''
  attachedFile.value = null
  if (textareaEl.value) textareaEl.value.style.height = 'auto'
  await scrollBottom()

  aiTyping.value = true
  await scrollBottom()

  // AI 응답 시뮬레이션 (실제: Anthropic API 호출)
  await new Promise(r => setTimeout(r, 1800))

  const isEvalRequest = text.includes('평가') || text.includes('분석') || text.includes('검토') || !!file
  const aiMsg: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: isEvalRequest
      ? generateEvalResponse(text || file?.name || '')
      : generateChatResponse(text),
    time: nowStr(),
    evaluation: isEvalRequest ? generateScores() : undefined,
  }
  aiTyping.value = false
  messages.value.push(aiMsg)
  await scrollBottom()

  // 첫 메시지면 히스토리에 저장
  if (messages.value.length === 2) {
    saveChat(text || file?.name || '새 평가')
  } else {
    updateCurrentChat()
  }
}

function generateEvalResponse(topic: string): string {
  return `**${topic || '제출된 특허'}**에 대한 AI 평가 결과입니다.\n\n해당 특허는 기술적 차별성이 높으며, 반도체 제조 분야에서의 실용적 가치가 인정됩니다. 청구항의 권리 범위가 명확하고 선행 기술과의 차이점이 뚜렷합니다.\n\n추가로 궁금한 점이 있으시면 질문해주세요.`
}

function generateChatResponse(text: string): string {
  if (text.includes('비용') || text.includes('연차료'))
    return '연차료는 출원 국가와 경과 연수에 따라 다릅니다. 한국의 경우 등록 후 매년 납부하며, 연차가 높아질수록 금액이 증가합니다. 구체적인 특허 번호를 알려주시면 예상 연차료를 산출해드릴 수 있습니다.'
  if (text.includes('유사') || text.includes('선행'))
    return '유사 특허 검색을 위해서는 IPC/CPC 분류코드와 핵심 기술 키워드가 필요합니다. 특허 원문이나 주요 청구항을 공유해주시면 관련 선행기술 분석을 도와드리겠습니다.'
  return '네, 이해했습니다. 추가 정보를 제공해주시거나, 구체적인 특허 내용을 공유해주시면 더 정확한 분석이 가능합니다. 어떤 부분이 가장 궁금하신가요?'
}

function generateScores(): EvalScore[] {
  return [
    { label: '기술성', score: Math.round(6 + Math.random() * 3.5), color: '#6366f1' },
    { label: '권리성', score: Math.round(5 + Math.random() * 4),   color: '#0ea5e9' },
    { label: '사업성', score: Math.round(5.5 + Math.random() * 4), color: '#10b981' },
  ]
}

// ── 로컬 스토리지 (대화 이력) ────────────────────────
function loadHistory(): ChatRecord[] {
  try {
    return JSON.parse(localStorage.getItem('skipa_lab_history') ?? '[]')
  } catch { return [] }
}

function saveHistory() {
  localStorage.setItem('skipa_lab_history', JSON.stringify(chatHistory.value))
}

function saveChat(title: string) {
  const record: ChatRecord = {
    id: Date.now().toString(),
    title: title.slice(0, 24),
    date: new Date().toLocaleDateString('ko-KR'),
    messages: [...messages.value],
  }
  activeChatId.value = record.id
  chatHistory.value.unshift(record)
  if (chatHistory.value.length > 20) chatHistory.value = chatHistory.value.slice(0, 20)
  saveHistory()
}

function updateCurrentChat() {
  const idx = chatHistory.value.findIndex(c => c.id === activeChatId.value)
  if (idx !== -1) {
    chatHistory.value[idx].messages = [...messages.value]
    saveHistory()
  }
}

function loadChat(h: ChatRecord) {
  activeChatId.value = h.id
  messages.value = [...h.messages]
  nextTick(() => scrollBottom())
}

function deleteChat(i: number) {
  if (chatHistory.value[i].id === activeChatId.value) resetChat()
  chatHistory.value.splice(i, 1)
  saveHistory()
}

function resetChat() {
  messages.value = []
  activeChatId.value = null
  inputText.value = ''
  attachedFile.value = null
}

// ── 파일 첨부 ────────────────────────────────────────
function handleFileAttach(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) attachedFile.value = file
}

// ── 유틸 ────────────────────────────────────────────
function nowStr() { return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }

function renderText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

function autoResize() {
  if (!textareaEl.value) return
  textareaEl.value.style.height = 'auto'
  textareaEl.value.style.height = Math.min(textareaEl.value.scrollHeight, 140) + 'px'
}

async function scrollBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}
</script>

<style scoped>
.lab-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
  height: calc(100vh - 120px);
}

/* ── 페이지 헤더 ─────────────────────────────────── */
.page-header {
  display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.page-header__eyebrow {
  font-size: 12px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; color: #6366f1; margin: 0 0 5px;
}
.page-header__title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; letter-spacing: -0.02em; }
.page-header__desc  { font-size: 13.5px; color: #64748b; margin: 0; }

.btn-new-chat {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 9px;
  font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; color: #374151;
  transition: background .13s;
}
.btn-new-chat:hover { background: #f8fafc; }

/* ── 레이아웃 ─────────────────────────────────────── */
.lab-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* ── 이력 사이드바 ────────────────────────────────── */
.history-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.history-sidebar__title {
  font-size: 11.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: #94a3b8; margin: 0;
}

.history-list { display: flex; flex-direction: column; gap: 4px; }

.history-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: background .12s;
}
.history-item:hover { background: #f8fafc; }
.history-item--active { background: #eef2ff; }

.history-item__icon {
  width: 28px; height: 28px;
  background: #f1f5f9; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; flex-shrink: 0;
}
.history-item--active .history-item__icon { background: #e0e7ff; color: #6366f1; }

.history-item__info { flex: 1; min-width: 0; }
.history-item__title {
  font-size: 12.5px; font-weight: 600; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0 0 2px;
}
.history-item__date { font-size: 11px; color: #94a3b8; margin: 0; }

.history-item__del {
  background: none; border: none; cursor: pointer; color: #cbd5e1;
  display: none; padding: 2px; border-radius: 4px;
  transition: color .12s, background .12s;
}
.history-item:hover .history-item__del { display: flex; }
.history-item__del:hover { color: #ef4444; background: #fef2f2; }

.history-empty { padding: 20px 0; text-align: center; font-size: 12.5px; color: #cbd5e1; }

/* ── 채팅 영역 ───────────────────────────────────── */
.chat-area {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 웰컴 화면 */
.chat-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 24px;
  text-align: center;
}

.chat-welcome__icon {
  width: 60px; height: 60px;
  background: linear-gradient(145deg, #eef2ff, #e0e7ff);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.chat-welcome__title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
.chat-welcome__desc  { font-size: 13.5px; color: #64748b; line-height: 1.7; margin: 0; }

.quick-start {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  max-width: 480px;
  margin-top: 8px;
}

.quick-start-card {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; font-size: 13px; color: #374151; font-weight: 500;
  text-align: left;
  transition: background .13s, border-color .13s;
}
.quick-start-card:hover { background: #f1f5f9; border-color: #cbd5e1; }
.quick-start-card__emoji { font-size: 18px; flex-shrink: 0; }

/* 메시지 목록 */
.messages-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

/* 메시지 */
.message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}
.message--user {
  flex-direction: row-reverse;
  align-self: flex-end;
}
.message--assistant { align-self: flex-start; }

.message__avatar {
  width: 30px; height: 30px; flex-shrink: 0;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}

.message__bubble {
  display: flex; flex-direction: column; gap: 6px;
}

.message__file {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: rgba(255,255,255,.15);
  border-radius: 7px;
  font-size: 12px; color: #fff; font-weight: 500;
}

.message--user .message__bubble {
  align-items: flex-end;
}

.message--user .message__text {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  border-radius: 14px 14px 4px 14px;
}
.message--assistant .message__text {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 14px 14px 14px 4px;
}

.message__text {
  padding: 12px 16px;
  font-size: 14px; line-height: 1.7;
  max-width: 100%;
  word-break: break-word;
}

.message__time {
  font-size: 10.5px; color: #94a3b8; margin: 0;
  padding: 0 4px;
}

/* 평가 결과 카드 */
.eval-card {
  background: linear-gradient(135deg, #fafbff, #f0f0ff);
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.eval-card__title {
  font-size: 12px; font-weight: 700; color: #6366f1;
  text-transform: uppercase; letter-spacing: .06em; margin: 0;
}

.eval-scores { display: flex; flex-direction: column; gap: 8px; }

.eval-score {
  display: grid; grid-template-columns: 52px 1fr 50px; align-items: center; gap: 8px;
}
.eval-score__label { font-size: 12.5px; font-weight: 600; color: #374151; }
.eval-score__bar-wrap { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.eval-score__bar {
  height: 100%; border-radius: 3px;
  transition: width .7s cubic-bezier(.4,0,.2,1);
}
.eval-score__value { font-size: 13px; font-weight: 700; text-align: right; }

/* 타이핑 인디케이터 */
.typing-indicator {
  display: flex; gap: 4px; align-items: center;
  padding: 14px 18px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 14px 14px 14px 4px;
}
.typing-indicator span {
  width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;
  animation: typingBounce 1.2s ease-in-out infinite;
}
.typing-indicator span:nth-child(2) { animation-delay: .2s; }
.typing-indicator span:nth-child(3) { animation-delay: .4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* ── 입력 영역 ───────────────────────────────────── */
.input-area {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attached-file {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px;
  font-size: 13px; color: #4338ca; font-weight: 500;
}
.attached-file button {
  background: none; border: none; cursor: pointer; color: #6366f1;
  display: flex; margin-left: auto;
}

.input-box {
  display: flex; align-items: flex-end; gap: 8px;
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 8px 8px 8px 12px;
  background: #fafafa;
  transition: border-color .15s, box-shadow .15s;
}
.input-box--focused {
  border-color: #6366f1; background: #fff;
  box-shadow: 0 0 0 3px rgba(99,102,241,.1);
}

.input-attach {
  background: none; border: none; cursor: pointer;
  color: #94a3b8; display: flex; padding: 6px;
  border-radius: 7px; flex-shrink: 0;
  transition: color .13s, background .13s;
}
.input-attach:hover { color: #6366f1; background: #eef2ff; }

.input-textarea {
  flex: 1; border: none; background: transparent;
  font-size: 14px; font-family: inherit; color: #0f172a;
  resize: none; outline: none; line-height: 1.6;
  min-height: 24px; max-height: 140px;
  overflow-y: auto;
}
.input-textarea::placeholder { color: #cbd5e1; }

.input-send {
  width: 36px; height: 36px; flex-shrink: 0;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff; border: none; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 3px 8px rgba(79,70,229,.3);
  transition: opacity .13s, transform .12s;
}
.input-send:hover:not(:disabled) { opacity: .9; transform: scale(1.04); }
.input-send:disabled { opacity: .35; cursor: not-allowed; }

.input-hint {
  font-size: 11.5px; color: #cbd5e1; margin: 0; text-align: center;
}

/* 전환 */
.slide-up-enter-active { transition: max-height .2s ease, opacity .15s; max-height: 60px; }
.slide-up-leave-active { transition: max-height .15s ease, opacity .12s; }
.slide-up-enter-from, .slide-up-leave-to { max-height: 0; opacity: 0; }
</style>
