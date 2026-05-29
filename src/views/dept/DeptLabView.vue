<script setup>
import { ref, nextTick } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const activeTab = ref('직접 입력')
const inputForm = ref({ title: '', description: '', countries: '', business: '', ipc: '' })
const evaluating = ref(false)
const result = ref(null)

const sessions = ref([
  { id: 1, title: '딥러닝 기반 결함 탐지', date: '2025-05-20' },
  { id: 2, title: '배터리 최적화 알고리즘', date: '2025-05-15' },
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
  comment: '기술적 독창성이 있으며 청구항 설정에 따라 권리 범위를 충분히 확보할 수 있습니다. 제시된 사업 분야에서의 상업적 활용 가능성이 높게 평가됩니다. 다만, 선행 기술 조사를 통해 신규성 확보 여부를 사전 검토하시기 바랍니다.',
}

function startEvaluation() {
  evaluating.value = true
  result.value = null
  chatMessages.value = []
  setTimeout(() => {
    result.value = { ...dummyScores }
    evaluating.value = false
    const newId = Date.now()
    sessions.value.unshift({ id: newId, title: inputForm.value.title || '새 평가', date: new Date().toISOString().slice(0, 10) })
    currentSessionId.value = newId
    chatMessages.value.push({ role: 'assistant', text: `안녕하세요! "${inputForm.value.title || '입력하신 특허'}"에 대한 AI 사전 평가가 완료되었습니다. 평가 결과에 대해 궁금한 점이 있으시면 질문해 주세요.` })
  }, 2000)
}

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
              <div class="text-gray-400 mt-0.5">{{ s.date }}</div>
            </div>
            <button
              @click="result = null; chatMessages = []; currentSessionId = null; inputForm = { title: '', description: '', countries: '', business: '', ipc: '' };"
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
          <div class="flex gap-0 mb-4">
            <button
              v-for="tab in ['직접 입력', 'PDF 업로드']"
              :key="tab"
              @click="activeTab = tab"
              class="px-4 py-2 text-sm cursor-pointer"
              :style="activeTab === tab ? 'color:#FF7A00; border-bottom:2px solid #FF7A00; background:transparent; border-left:none; border-right:none; border-top:none;' : 'color:#9ca3af; border:none; background:transparent;'"
            >{{ tab }}</button>
          </div>

          <div v-if="activeTab === '직접 입력'" class="space-y-3">
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

          <div v-else class="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div class="text-4xl mb-3">📄</div>
            <div class="text-sm font-medium text-gray-600 mb-1">PDF 파일을 드래그하거나 클릭하여 업로드</div>
            <div class="text-xs text-gray-400">특허 명세서 PDF 파일 지원</div>
          </div>

          <button
            @click="startEvaluation"
            :disabled="evaluating || (!inputForm.title && activeTab === '직접 입력')"
            class="mt-4 px-6 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
            :style="evaluating || (!inputForm.title && activeTab === '직접 입력')
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
          <p class="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">{{ result.comment }}</p>
        </div>

        <!-- 챗봇 영역 -->
        <div v-if="result" class="bg-white rounded-xl flex flex-col" style="border:1px solid #E2E8F0; min-height:300px;">
          <div class="px-5 py-3 border-b border-gray-100">
            <div class="text-sm font-semibold text-gray-700">평가 결과 질의응답</div>
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
