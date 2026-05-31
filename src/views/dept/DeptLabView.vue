<script setup>
import { ref, nextTick } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const inputForm = ref({ title: '', description: '', countries: '', business: '', ipc: '', claims: [''] })
const evaluating = ref(false)
const result = ref(null)

const sessions = ref([
  { id: 1, title: '딥러닝 기반 결함 탐지', date: '2025-05-20', grade: 'A' },
  { id: 2, title: '배터리 최적화 알고리즘', date: '2025-05-15', grade: 'B' },
])
const currentSessionId = ref(null)

const chatMessages = ref([])
const chatInput = ref('')
const chatScrollEl = ref(null)

const dummyScores = {
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

function startEvaluation() {
  evaluating.value = true
  result.value = null
  chatMessages.value = []
  setTimeout(() => {
    result.value = { ...dummyScores }
    evaluating.value = false
    // simple IPC auto-assignment based on keywords in inputs
    inputForm.value.ipc = assignIPC(`${inputForm.value.title} ${inputForm.value.description} ${inputForm.value.business} ${inputForm.value.claims.join(' ')}`)

    const newId = Date.now()
    sessions.value.unshift({ id: newId, title: inputForm.value.title || '새 평가', date: new Date().toISOString().slice(0, 10), grade: dummyScores.grade })
    currentSessionId.value = newId
    chatMessages.value.push({ role: 'assistant', text: `안녕하세요! "${inputForm.value.title || '입력하신 특허'}"에 대한 AI 사전 평가가 완료되었습니다. 배정된 IPC: ${inputForm.value.ipc}. 평가 결과에 대해 궁금한 점이 있으시면 질문해 주세요.` })
  }, 2000)
}

function assignIPC(text) {
  const t = (text || '').toLowerCase()
  if (t.includes('딥러닝') || t.includes('cnn') || t.includes('비전') || t.includes('이미지')) return 'G06T 7/00'
  if (t.includes('연합학습') || t.includes('federated') || t.includes('ml') || t.includes('ai')) return 'G06N 20/00'
  if (t.includes('통신') || t.includes('5g') || t.includes('빔포밍') || t.includes('qkd') || t.includes('네트워크')) return 'H04L 12/00'
  if (t.includes('태양광') || t.includes('수소') || t.includes('에너지') || t.includes('연료전지')) return 'H02J 3/38'
  if (t.includes('로봇') || t.includes('제조') || t.includes('스마트팩토리')) return 'B25J 9/16'
  return 'G06F 9/50' // fallback
}

function addClaim() { inputForm.value.claims.push('') }
function removeClaim(i) { if (inputForm.value.claims.length > 1) inputForm.value.claims.splice(i, 1) }

async function sendChat() {
  const msg = chatInput.value.trim()
  if (!msg) return
  chatMessages.value.push({ role: 'user', text: msg })
  chatInput.value = ''
  await nextTick()
  if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight

  setTimeout(async () => {
    const responses = [
      '해당 기술 분야에서 유사한 선행 특허가 일부 존재합니다만, 귀사의 청구항이 차별화된 구성 요소를 포함하고 있어 신규성을 인정받을 가능성이 있습니다.',
      '사업성 점수가 높은 이유는, 제시하신 기술이 현재 시장에서 활발히 수요가 증가하고 있는 분야와 직접 연관되기 때문입니다.',
      '출원 국가 선택 시, 해당 기술의 주요 시장인 한국·미국·유럽을 우선적으로 고려하시길 권장합니다.',
      '기술성 점수 향상을 위해서는 청구항의 특허 요건(신규성·진보성)을 명확히 뒷받침하는 실시 예시를 보강하는 것이 좋습니다.',
    ]
    const reply = responses[Math.floor(Math.random() * responses.length)]
    chatMessages.value.push({ role: 'assistant', text: reply })
    await nextTick()
    if (chatScrollEl.value) chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight
  }, 800)
}

const gradeColor = { S: '#FF7A00', A: '#3B82F6', B: '#10B981', C: '#94A3B8' }
</script>

<template>
  <AppLayout title="사전 평가 Lab">
    <div class="flex gap-4" style="min-height:calc(100vh - 140px);">
      <!-- 좌측 패널: 이전 대화 목록 -->
      <div class="w-56 shrink-0">
        <div class="bg-white rounded-xl p-4" style="border:1px solid #E2E8F0;">
          <div class="text-sm font-semibold text-gray-700 mb-3">이전 평가 이력</div>
          <div class="space-y-2">
            <div
              v-for="s in sessions"
              :key="s.id"
              class="p-2.5 rounded-lg cursor-pointer text-xs transition-all"
              :style="currentSessionId === s.id ? 'background:#FFF7F0; border:1px solid rgba(255,122,0,0.3);' : 'background:#F8FAFC; border:1px solid #F1F5F9;'"
              @click="currentSessionId = s.id"
            >
              <div class="font-medium text-gray-800 truncate">{{ s.title }}</div>
              <div class="mt-1 flex items-center justify-between gap-2">
                <div class="text-gray-400">{{ s.date }}</div>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold"
                  style="background:#FFF7F0; color:#FF7A00; border:1px solid rgba(255,122,0,0.2);"
                >{{ s.grade || '-' }}</span>
              </div>
            </div>
            <button
              @click="result = null; chatMessages = []; currentSessionId = null; inputForm = { title: '', description: '', countries: '', business: '', ipc: '', claims: [''] };"
              class="w-full py-2 text-xs rounded-lg cursor-pointer"
              style="background:transparent; border:1px dashed #E2E8F0; color:#94A3B8;"
            >+ 새 평가 시작</button>
          </div>
        </div>
      </div>

      <!-- 우측 메인 -->
      <div class="flex-1 flex flex-col gap-4">
        <!-- 입력 영역 -->
        <div class="bg-white rounded-xl p-5" style="border:1px solid #E2E8F0;">
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">특허명 *</label>
                <input v-model="inputForm.title" placeholder="발명의 명칭" class="field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">출원 예정 국가</label>
                <input v-model="inputForm.countries" placeholder="예: 한국, 미국" class="field" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">기술 설명 *</label>
              <textarea v-model="inputForm.description" rows="3" placeholder="발명의 핵심 기술 내용을 입력하세요" class="field resize-none" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">청구항</label>
              <div class="space-y-2">
                <div v-for="(c, i) in inputForm.claims" :key="i" class="flex items-start gap-2">
                  <textarea v-model="inputForm.claims[i]" rows="2" placeholder="청구항 내용을 입력하세요" class="field flex-1 resize-none"></textarea>
                  <div class="flex flex-col gap-2">
                    <button @click="addClaim" class="px-2 py-1 bg-gray-100 rounded-md text-sm" title="추가">+</button>
                    <button @click="removeClaim(i)" :disabled="inputForm.claims.length<=1" class="px-2 py-1 bg-gray-100 rounded-md text-sm" title="삭제">-</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">관련 사업</label>
                <input v-model="inputForm.business" placeholder="예: 반도체 제조 공정" class="field" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">IPC 분류 (선택)</label>
                <input v-model="inputForm.ipc" placeholder="예: G06T 7/00" class="field" />
              </div>
            </div>
          </div>

          <!-- PDF upload removed: only direct input is supported -->

          <button
            @click="startEvaluation"
            :disabled="evaluating || !inputForm.title"
            class="mt-4 px-6 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
            :style="evaluating || !inputForm.title
              ? 'background:#D1D5DB; border:none; cursor:not-allowed;'
              : 'background:#FF7A00; border:none;'"
          >
            {{ evaluating ? '평가 중...' : '평가 시작' }}
          </button>
        </div>

        <!-- 평가 결과 -->
        <div v-if="result" class="bg-white rounded-xl p-5" style="border:1px solid #E2E8F0;">
          <div class="text-sm font-semibold text-gray-700 mb-4">AI 사전 평가 보고서</div>
          <div class="grid grid-cols-4 gap-3 mb-4">
            <div v-for="(label, key) in { tech: '기술성', rights: '권리성', business: '사업성' }" :key="key"
              class="rounded-xl p-4 text-center" style="background:#F8FAFC;">
              <div class="text-xs text-gray-400 mb-1">{{ label }}</div>
              <div class="text-2xl font-bold" style="color:#FF7A00;">{{ result[key] }}</div>
              <div class="mt-2 h-1 rounded-full bg-gray-200">
                <div class="h-1 rounded-full" style="background:#FF7A00;" :style="`width:${result[key]}%`" />
              </div>
            </div>
            <div class="rounded-xl p-4 text-center" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
              <div class="text-xs text-gray-400 mb-1">종합 등급</div>
              <div class="text-3xl font-bold" :style="`color:${gradeColor[result.grade]};`">{{ result.grade }}</div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-sm font-semibold text-gray-700">항목별 AI 코멘트</div>
            <div class="rounded-lg p-3" style="background:#F8FAFC; border:1px solid #E2E8F0;">
              <div class="text-xs font-semibold text-gray-500 mb-1">기술성</div>
              <div class="text-sm text-gray-700 leading-relaxed">{{ result.comments.tech }}</div>
            </div>
            <div class="rounded-lg p-3" style="background:#F8FAFC; border:1px solid #E2E8F0;">
              <div class="text-xs font-semibold text-gray-500 mb-1">권리성</div>
              <div class="text-sm text-gray-700 leading-relaxed">{{ result.comments.rights }}</div>
            </div>
            <div class="rounded-lg p-3" style="background:#F8FAFC; border:1px solid #E2E8F0;">
              <div class="text-xs font-semibold text-gray-500 mb-1">사업성</div>
              <div class="text-sm text-gray-700 leading-relaxed">{{ result.comments.business }}</div>
            </div>
            <div class="rounded-lg p-3" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
              <div class="text-xs font-semibold mb-1" style="color:#FF7A00;">종합 코멘트</div>
              <div class="text-sm text-gray-700 leading-relaxed">{{ result.comments.overall }}</div>
            </div>
          </div>
          <div v-if="inputForm.ipc" class="mt-3 text-sm text-gray-700">
            <span class="font-medium">배정된 IPC:</span>
            <span class="ml-2">{{ inputForm.ipc }}</span>
          </div>
        </div>

        <!-- 챗봇 영역 -->
        <div v-if="result" class="bg-white rounded-xl flex flex-col" style="border:1px solid #E2E8F0; min-height:300px;">
          <div class="px-5 py-3 border-b border-gray-100">
            <div class="text-sm font-semibold text-gray-700">평가 결과 질의응답</div>
            <div class="text-xs text-gray-500 mt-0.5">평가 결과에 대해 질문하세요</div>
          </div>
          <div ref="chatScrollEl" class="flex-1 p-4 space-y-3 overflow-y-auto" style="max-height:280px;">
            <div
              v-for="(msg, i) in chatMessages"
              :key="i"
              class="flex"
              :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                :style="msg.role === 'user'
                  ? 'background:#FF7A00; color:#fff; border-bottom-right-radius:4px;'
                  : 'background:#F8FAFC; color:#374151; border:1px solid #E2E8F0; border-bottom-left-radius:4px;'"
              >{{ msg.text }}</div>
            </div>
          </div>
          <div class="p-4 border-t border-gray-100 flex gap-2">
            <input
              v-model="chatInput"
              placeholder="평가 결과에 대해 질문하세요..."
              class="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
              style="border:1px solid #E2E8F0;"
              @keyup.enter="sendChat"
              @focus="$event.target.style.borderColor='#FF7A00';"
              @blur="$event.target.style.borderColor='#E2E8F0';"
            />
            <button
              @click="sendChat"
              class="px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer"
              style="background:#FF7A00; border:none; shrink:0;"
            >전송</button>
          </div>
        </div>
      </div>
    </div>
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
</style>
