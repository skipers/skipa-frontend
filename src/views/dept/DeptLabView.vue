<script setup>
import { computed, nextTick, ref } from 'vue'
import { Bot, Maximize2, Minimize2, Send, X } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'

const demoForm = {
  title: '딥러닝 기반 결함 탐지',
  description: '반도체 검사 이미지에서 결함을 자동 탐지하고 불량 유형을 분류하는 AI 비전 기술',
  claims: [
    '검사 이미지에서 결함 후보 영역을 추출하고 딥러닝 모델로 결함 유형을 판별하는 방법',
    '판별 결과와 공정 이력 데이터를 결합하여 결함 발생 원인을 추천하는 시스템',
  ],
  business: '반도체 제조 공정 품질관리',
  countries: '한국, 미국, 유럽',
}

const demoResult = {
  ipc: 'G06T 7/00',
  tech: 82,
  rights: 75,
  business: 88,
  grade: 'A',
  comments: {
    tech: '핵심 알고리즘의 차별성이 비교적 명확하며 구현 난이도 대비 성능 개선 폭이 커 기술성 점수가 높습니다.',
    rights: '청구항 초안의 범위가 다소 넓어 거절 가능성이 있어, 핵심 구성요소 중심으로 권리화 전략을 정교화하는 것이 좋습니다.',
    business: '현재 사업부 로드맵과 직접 연결되며 도입 시 비용 절감 효과가 예상되어 사업성이 높게 평가되었습니다.',
    overall: '선행기술 대비 차별 포인트를 명세서에서 더 명확히 제시하면 종합 등급 상향 가능성이 있습니다.',
  },
}

const inputForm = ref({ ...demoForm, claims: [...demoForm.claims] })

const evaluating = ref(false)
const result = ref({ ...demoResult, comments: { ...demoResult.comments } })

const sessions = ref([
  {
    id: 1,
    name: '딥러닝 기반 결함 탐지',
    date: '2025-05-20',
    grade: 'A',
    form: { ...demoForm, claims: [...demoForm.claims] },
    result: { ...demoResult, comments: { ...demoResult.comments } },
  },
  {
    id: 2,
    name: '배터리 최적화 알고리즘',
    date: '2025-05-15',
    grade: 'B',
    form: {
      title: '배터리 최적화 알고리즘',
      description: '배터리 사용 효율을 높이는 제어 기술',
      claims: ['전력 소모 최적화 방법'],
      business: '에너지 관리',
      countries: '한국',
    },
    result: {
      ipc: 'H02J 3/38',
      tech: 68,
      rights: 64,
      business: 72,
      grade: 'B',
      comments: {
        tech: '기술 구성은 실용적이지만 차별 포인트를 더 명확히 정리하면 기술성 점수를 높일 수 있습니다.',
        rights: '청구항 범위가 다소 넓어 선행기술 대응 논리를 보완할 필요가 있습니다.',
        business: '사업 적용성은 양호하나 구체적 도입 시나리오를 추가하면 설득력이 좋아집니다.',
        overall: '세부 구현 예시와 비교 포인트를 보강하면 유지 권고 가능성이 높아집니다.',
      },
    },
  },
])

const selectedSessionId = ref(1)
const chatbotOpen = ref(false)
const chatbotExpanded = ref(false)
const chatMessages = ref([])
const chatInput = ref('')
const chatScrollEl = ref(null)
const typingIndicator = ref(false)

const canStartEvaluation = computed(() => inputForm.value.title.trim() && inputForm.value.description.trim())
const autoIpc = computed(() => result.value?.ipc || 'G06T 7/00')
const activeSession = computed(() => sessions.value.find((session) => session.id === selectedSessionId.value) || null)
const panelWidth = computed(() => (chatbotExpanded.value ? '100vw' : '400px'))
const contentOffset = computed(() => (chatbotOpen.value && !chatbotExpanded.value ? panelWidth.value : '0px'))

function scoreTone(score) {
  if (score >= 90) return '#10B981'
  if (score >= 60) return '#FF7A00'
  return '#EA002C'
}

function scoreBarStyle(score) {
  return `width:${score}%; background:${scoreTone(score)};`
}

function addClaim() {
  inputForm.value.claims.push('')
}

function resetEvaluation() {
  inputForm.value = {
    title: '',
    description: '',
    claims: [''],
    business: '',
    countries: '',
  }
  evaluating.value = false
  result.value = null
  selectedSessionId.value = null
  chatbotOpen.value = false
  chatbotExpanded.value = false
  chatMessages.value = []
  chatInput.value = ''
  typingIndicator.value = false
}

function loadSession(session) {
  if (!session) return
  inputForm.value = {
    title: session.form.title || '',
    description: session.form.description || '',
    claims: session.form.claims?.length ? [...session.form.claims] : [''],
    business: session.form.business || '',
    countries: session.form.countries || '',
  }
  result.value = { ...session.result }
  chatbotOpen.value = false
  chatbotExpanded.value = false
  chatMessages.value = []
  chatInput.value = ''
  typingIndicator.value = false
}

function toggleChatbot() {
  chatbotOpen.value = !chatbotOpen.value
  if (chatbotOpen.value && chatMessages.value.length === 0) {
    chatMessages.value.push({ role: 'assistant', text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.' })
  }
  if (!chatbotOpen.value) {
    chatbotExpanded.value = false
  }
}

function toggleExpand() {
  chatbotExpanded.value = !chatbotExpanded.value
}

async function startEvaluation() {
  if (!canStartEvaluation.value) return
  evaluating.value = true
  result.value = null
  selectedSessionId.value = null

  setTimeout(async () => {
    const nextResult = {
      ipc: 'G06T 7/00',
      tech: 82,
      rights: 75,
      business: 88,
      grade: 'A',
      comments: {
        tech: '핵심 알고리즘의 차별성이 비교적 명확하며 구현 난이도 대비 성능 개선 폭이 커 기술성 점수가 높습니다.',
        rights: '청구항 초안의 범위가 다소 넓어 거절 가능성이 있어, 핵심 구성요소 중심으로 권리화 전략을 정교화하는 것이 좋습니다.',
        business: '현재 사업부 로드맵과 직접 연결되며 도입 시 비용 절감 효과가 예상되어 사업성이 높게 평가되었습니다.',
        overall: '선행기술 대비 차별 포인트를 명세서에서 더 명확히 제시하면 종합 등급 상향 가능성이 있습니다.',
      },
    }

    result.value = nextResult
    evaluating.value = false
    chatMessages.value = [{ role: 'assistant', text: '안녕하세요! 평가 결과에 대해 궁금한 점을 질문해주세요.' }]
    typingIndicator.value = false
    await nextTick()
    if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight
  }, 1200)
}

async function sendChat() {
  const message = chatInput.value.trim()
  if (!message || !result.value || typingIndicator.value) return

  chatMessages.value.push({ role: 'user', text: message })
  chatInput.value = ''
  typingIndicator.value = true
  await nextTick()
  if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight

  setTimeout(async () => {
    typingIndicator.value = false
    chatMessages.value.push({
      role: 'assistant',
      text: '해당 특허의 기술성 점수가 높은 이유는 선행 기술 대비 독창적인 구조를 채택했기 때문입니다.',
    })
    await nextTick()
    if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight
  }, 1000)
}
</script>

<template>
  <AppLayout title="사전 평가 Lab">
    <div class="transition-[padding-right] duration-300 ease-in-out overflow-x-hidden" :style="{ paddingRight: contentOffset }">
      <div class="mb-4 rounded-xl bg-white px-4 py-3" style="border:1px solid #E2E8F0;">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm font-semibold text-gray-800">이전 평가 이력</div>
            <div class="text-xs text-gray-500 mt-0.5">저장된 평가 결과를 선택해 다시 불러올 수 있습니다.</div>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-3">
            <select
              v-model="selectedSessionId"
              @change="loadSession(activeSession)"
              class="min-w-[320px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option disabled :value="null">이전 평가 선택</option>
              <option v-for="session in sessions" :key="session.id" :value="session.id">
                {{ session.name }} · {{ session.date }} · {{ session.grade }}
              </option>
            </select>
            <button
              @click="resetEvaluation"
              class="rounded-lg px-4 py-2 text-sm font-semibold"
              style="background:#FF7A00; color:#fff; border:none;"
            >+ 새 평가 시작</button>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[40%_60%]">
        <section class="rounded-xl bg-white p-5" style="border:1px solid #E2E8F0;">
          <div class="mb-4">
            <div class="text-[18px] font-semibold text-gray-800">발명 정보 입력</div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">특허명 *</label>
              <input v-model="inputForm.title" placeholder="발명의 명칭" class="field" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">기술 설명 *</label>
              <textarea v-model="inputForm.description" rows="4" placeholder="발명의 핵심 기술 내용을 입력하세요" class="field resize-none"></textarea>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">청구항</label>
              <div class="space-y-2">
                <div v-for="(claim, index) in inputForm.claims" :key="index" class="flex items-start gap-2">
                  <textarea v-model="inputForm.claims[index]" rows="2" placeholder="청구항 내용을 입력하세요" class="field flex-1 resize-none"></textarea>
                  <button @click="addClaim" class="mt-1 h-9 w-9 rounded-lg text-lg font-semibold" style="background:#F8FAFC; border:1px solid #E2E8F0; color:#FF7A00;">+</button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">관련 사업</label>
                <input v-model="inputForm.business" placeholder="예: 반도체 제조 공정" class="field" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">출원 예정 국가</label>
                <input v-model="inputForm.countries" placeholder="예: 한국, 미국" class="field" />
              </div>
            </div>

            <button
              @click="startEvaluation"
              :disabled="evaluating || !canStartEvaluation"
              class="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white"
              :style="evaluating || !canStartEvaluation ? 'background:#D1D5DB; cursor:not-allowed; border:none;' : 'background:#FF7A00; border:none;'"
            >
              {{ evaluating ? '평가 중...' : '평가 시작' }}
            </button>
          </div>
        </section>

        <section class="rounded-xl p-5" style="border:1px solid #E2E8F0; background:#FFFFFF;">
          <div v-if="!result" class="flex min-h-[620px] items-center justify-center rounded-xl" style="background:#F8FAFC; border-radius:12px;">
            <div class="text-center">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style="background:rgba(255,122,0,0.12); color:#FF7A00;">
                <span class="text-xl">✦</span>
              </div>
              <div class="text-sm text-gray-600">발명 정보를 입력하고 평가를 시작하면 결과가 여기에 표시됩니다.</div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="rounded-xl p-4" style="background:#F8FAFC; border:1px solid #E2E8F0;">
              <div class="text-xs font-semibold text-gray-500 mb-1">AI 자동 분류 IPC</div>
              <div class="text-base font-semibold text-gray-800">{{ autoIpc }}</div>
            </div>

            <div class="rounded-xl p-5 text-center" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
              <div class="text-xs font-semibold text-gray-500 mb-2">종합 등급</div>
              <div class="text-5xl font-bold" style="color:#FF7A00;">{{ result.grade }}</div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div v-for="(label, key) in { tech: '기술성', rights: '권리성', business: '사업성' }" :key="key" class="rounded-xl p-4" style="background:#FFFFFF; border:1px solid #E2E8F0;">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <div class="text-sm font-semibold text-gray-800">{{ label }}</div>
                  <div class="text-sm font-bold" :style="`color:${scoreTone(result[key])};`">{{ result[key] }}점</div>
                </div>
                <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full" :style="scoreBarStyle(result[key])" />
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div class="rounded-xl p-4" style="background:#F8FAFC; border:1px solid #E2E8F0;">
                <div class="text-xs font-semibold text-gray-500 mb-1">기술성 코멘트</div>
                <div class="text-sm leading-6 text-gray-700">{{ result.comments.tech }}</div>
              </div>
              <div class="rounded-xl p-4" style="background:#F8FAFC; border:1px solid #E2E8F0;">
                <div class="text-xs font-semibold text-gray-500 mb-1">권리성 코멘트</div>
                <div class="text-sm leading-6 text-gray-700">{{ result.comments.rights }}</div>
              </div>
              <div class="rounded-xl p-4" style="background:#F8FAFC; border:1px solid #E2E8F0;">
                <div class="text-xs font-semibold text-gray-500 mb-1">사업성 코멘트</div>
                <div class="text-sm leading-6 text-gray-700">{{ result.comments.business }}</div>
              </div>
              <div class="rounded-xl p-4" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
                <div class="text-xs font-semibold mb-1" style="color:#FF7A00;">종합 코멘트</div>
                <div class="text-sm leading-6 text-gray-700">{{ result.comments.overall }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <button
      v-if="!chatbotOpen"
      @click="toggleChatbot"
      class="fixed bottom-8 right-8 z-[230] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(255,122,0,0.35)] transition-transform duration-200 hover:scale-105"
      style="background:#FF7A00; border:none;"
      aria-label="챗봇 열기"
    >
      <Bot class="h-6 w-6" />
    </button>

    <transition name="chatbot-panel">
      <aside
        v-if="chatbotOpen"
        class="fixed right-0 top-0 bottom-0 z-[240] flex flex-col overflow-hidden bg-white"
        :style="{ width: panelWidth, borderLeft: '1px solid #E2E8F0', transition: 'width 0.3s ease, transform 0.3s ease' }"
      >
        <div class="flex items-center justify-between gap-3 px-4 py-3" style="background:#FF7A00; color:#fff;">
          <button @click="toggleExpand" class="flex items-center gap-2 rounded-md px-3 py-2 text-white transition-transform hover:scale-105" style="background:rgba(255,255,255,0.16); border:none;">
            <component :is="chatbotExpanded ? Minimize2 : Maximize2" class="h-4 w-4" />
            <span class="text-xs font-semibold">{{ chatbotExpanded ? '축소' : '확대' }}</span>
          </button>
          <div class="text-sm font-bold tracking-wide">SKIPA AI</div>
          <button @click="toggleChatbot" class="flex items-center gap-2 rounded-md px-3 py-2 text-white transition-transform hover:scale-105" style="background:rgba(255,255,255,0.16); border:none;">
            <X class="h-4 w-4" />
            <span class="text-xs font-semibold">닫기</span>
          </button>
        </div>

        <div ref="chatScrollEl" class="flex-1 overflow-y-auto bg-white p-4">
          <div class="mx-auto flex h-full max-w-3xl flex-col gap-3">
            <div
              v-for="(msg, index) in chatMessages"
              :key="index"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                :style="msg.role === 'user'
                  ? 'background:#FF7A00; color:#fff; border-bottom-right-radius:4px;'
                  : 'background:#F8FAFC; color:#374151; border:1px solid #E2E8F0; border-bottom-left-radius:4px;'"
              >
                {{ msg.text }}
              </div>
            </div>

            <div v-if="typingIndicator" class="flex justify-start">
              <div class="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3" style="border:1px solid #E2E8F0; border-bottom-left-radius:4px;">
                <span class="typing-dot" />
                <span class="typing-dot" />
                <span class="typing-dot" />
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 bg-white p-3">
          <div class="mx-auto flex max-w-3xl gap-2">
            <input
              v-model="chatInput"
              placeholder="질문을 입력하세요..."
              class="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style="border:1px solid #E2E8F0;"
              :disabled="!result"
              @keyup.enter.prevent="sendChat"
            />
            <button
              @click="sendChat"
              class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              :disabled="!result || typingIndicator"
              :style="result && !typingIndicator ? 'background:#FF7A00; border:none;' : 'background:#D1D5DB; border:none; cursor:not-allowed;'"
            >
              <Send class="h-4 w-4" />
              전송
            </button>
          </div>
        </div>
      </aside>
    </transition>
  </AppLayout>
</template>

<style scoped>
.field {
  width: 100%;
  padding: 7px 12px;
  font-size: 13px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
}

.field:focus {
  border-color: #FF7A00;
  box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
}

.chatbot-panel-enter-active,
.chatbot-panel-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease;
}

.chatbot-panel-enter-from,
.chatbot-panel-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #FF7A00;
  animation: typingPulse 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typingPulse {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
}
</style>
