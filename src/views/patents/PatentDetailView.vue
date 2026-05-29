<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const patent = computed(() => PATENTS.find((p) => p.id === route.params.id))
const activeTab = ref('원문')
const tabs = ['원문', 'AI 평가 보고서', '유사 특허 분석', '사내 프로젝트 연관 정보', '유지/포기 의견 제출']

const opinion = ref(patent.value?.evaluation?.opinion || null)
const comment = ref(patent.value?.evaluation?.comment || '')
const submitted = ref(!!patent.value?.evaluation?.replyDate)

const gradeColor = { S: '#FF7A00', A: '#3B82F6', B: '#10B981', C: '#94A3B8' }

function submitOpinion() {
  submitted.value = true
  alert(`의견이 제출되었습니다: ${opinion.value}`)
}

function goBack() {
  router.back()
}
</script>

<template>
  <AppLayout :title="patent?.title || '특허 상세'">
    <div v-if="!patent" class="text-center py-20 text-gray-400">특허를 찾을 수 없습니다.</div>
    <template v-else>
      <!-- 헤더 카드 -->
      <div class="bg-white rounded-xl p-5 mb-4" style="border:1px solid #E2E8F0;">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <button @click="goBack" class="text-sm text-gray-400 hover:text-gray-600 cursor-pointer" style="background:none;border:none;padding:0;">← 목록으로</button>
            </div>
            <h2 class="text-xl font-bold text-gray-800 mt-2">{{ patent.title }}</h2>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-xs font-mono text-gray-500">{{ patent.number }}</span>
              <StatusBadge :status="patent.status" />
              <span class="text-xs text-gray-500">{{ patent.country }}</span>
              <span class="text-xs text-gray-500">{{ patent.dept }}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs text-gray-400 mb-1">AI 종합 등급</div>
            <div class="text-3xl font-bold" :style="`color:${gradeColor[patent.aiScore.grade]};`">{{ patent.aiScore.grade }}</div>
          </div>
        </div>
      </div>

      <!-- 탭 -->
      <div class="flex gap-0 mb-4 bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 text-sm font-medium transition-colors cursor-pointer"
          :style="activeTab === tab
            ? 'color:#FF7A00; border-bottom:2px solid #FF7A00; background:#FFF7F0;'
            : 'color:#6b7280; border-bottom:2px solid transparent; background:#fff;'"
          style="border:none; border-radius:0;"
        >{{ tab }}</button>
      </div>

      <!-- 탭 콘텐츠 -->
      <div class="bg-white rounded-xl p-6" style="border:1px solid #E2E8F0;">
        <!-- 원문 -->
        <div v-if="activeTab === '원문'">
          <div class="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div><span class="text-xs text-gray-400">특허번호</span><div class="text-sm font-mono text-gray-700 mt-0.5">{{ patent.number }}</div></div>
            <div><span class="text-xs text-gray-400">출원인</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.applicant }}</div></div>
            <div><span class="text-xs text-gray-400">발명자</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.inventors }}</div></div>
            <div><span class="text-xs text-gray-400">IPC 분류</span><div class="text-sm font-mono text-gray-700 mt-0.5">{{ patent.ipc }}</div></div>
            <div><span class="text-xs text-gray-400">출원일</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.filingDate }}</div></div>
            <div><span class="text-xs text-gray-400">등록일</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.registrationDate || '-' }}</div></div>
            <div><span class="text-xs text-gray-400">만료일</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.expiryDate }}</div></div>
            <div><span class="text-xs text-gray-400">키워드</span><div class="text-sm text-gray-700 mt-0.5">{{ patent.keywords }}</div></div>
          </div>
          <div class="mb-5">
            <div class="text-sm font-semibold text-gray-700 mb-2">발명의 요약</div>
            <p class="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">{{ patent.abstract }}</p>
          </div>
          <div>
            <div class="text-sm font-semibold text-gray-700 mb-2">청구항</div>
            <ol class="space-y-2">
              <li v-for="(claim, i) in patent.claims" :key="i" class="text-sm text-gray-600 leading-relaxed">
                <span class="font-semibold text-gray-800 mr-2">청구항 {{ i + 1 }}.</span>{{ claim }}
              </li>
            </ol>
          </div>
        </div>

        <!-- AI 평가 보고서 -->
        <div v-else-if="activeTab === 'AI 평가 보고서'">
          <div class="grid grid-cols-3 gap-4 mb-6">
            <div v-for="(label, key) in { tech: '기술성', rights: '권리성', business: '사업성' }" :key="key"
              class="rounded-xl p-5 text-center" style="background:#F8FAFC; border:1px solid #E2E8F0;">
              <div class="text-xs text-gray-500 mb-2">{{ label }}</div>
              <div class="text-3xl font-bold mb-2" style="color:#FF7A00;">{{ patent.aiScore[key] }}</div>
              <div class="text-xs text-gray-400">/ 100</div>
              <!-- Score bar -->
              <div class="mt-3 h-1.5 rounded-full bg-gray-200">
                <div class="h-1.5 rounded-full" style="background:#FF7A00;" :style="`width:${patent.aiScore[key]}%`" />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 mb-6 p-4 rounded-xl" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
            <div class="text-4xl font-bold" :style="`color:${gradeColor[patent.aiScore.grade]};`">{{ patent.aiScore.grade }}</div>
            <div>
              <div class="text-sm font-semibold text-gray-700">종합 등급</div>
              <div class="text-xs text-gray-500 mt-0.5">S: 최우수 / A: 우수 / B: 보통 / C: 재검토</div>
            </div>
          </div>

          <div>
            <div class="text-sm font-semibold text-gray-700 mb-2">AI 평가 코멘트</div>
            <p class="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-4">{{ patent.aiComment }}</p>
          </div>

          <!-- Legal: 사업부 코멘트 표시 -->
          <div v-if="auth.isLegal && patent.evaluation?.comment" class="mt-4 p-4 rounded-xl" style="background:#EFF6FF; border:1px solid #BFDBFE;">
            <div class="text-xs font-semibold text-blue-600 mb-1">사업부 의견 ({{ patent.dept }})</div>
            <div class="text-sm text-gray-700">{{ patent.evaluation.comment }}</div>
            <div class="text-xs text-gray-400 mt-1">의견: <StatusBadge :status="patent.evaluation.opinion" /></div>
          </div>
        </div>

        <!-- 유사 특허 분석 -->
        <div v-else-if="activeTab === '유사 특허 분석'">
          <div v-if="patent.similarPatents.length === 0" class="text-center py-12 text-gray-400 text-sm">유사 특허가 없습니다.</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">유사도</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허번호</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">국가</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sp in patent.similarPatents" :key="sp.id" style="border-bottom:1px solid #F1F5F9;">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-24 rounded-full bg-gray-200">
                      <div class="h-1.5 rounded-full" style="background:#FF7A00;" :style="`width:${sp.similarity}%`" />
                    </div>
                    <span class="text-xs font-semibold" style="color:#FF7A00;">{{ sp.similarity }}%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ sp.id }}</td>
                <td class="px-4 py-3 text-gray-800">{{ sp.title }}</td>
                <td class="px-4 py-3 text-xs text-gray-500">{{ sp.country }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 사내 프로젝트 연관 정보 -->
        <div v-else-if="activeTab === '사내 프로젝트 연관 정보'">
          <div v-if="patent.projects.length === 0" class="text-center py-12 text-gray-400 text-sm">연관 프로젝트가 없습니다.</div>
          <div v-else class="grid grid-cols-1 gap-3">
            <div
              v-for="proj in patent.projects"
              :key="proj.name"
              class="flex items-center justify-between p-4 rounded-xl"
              style="border:1px solid #E2E8F0;"
            >
              <div>
                <div class="text-sm font-semibold text-gray-800">{{ proj.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ proj.dept }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400 mb-1">연관도</div>
                <div class="text-lg font-bold" style="color:#FF7A00;">{{ proj.relevance }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 유지/포기 의견 제출 -->
        <div v-else-if="activeTab === '유지/포기 의견 제출'">
          <div v-if="auth.isLegal" class="text-center py-12 text-gray-400 text-sm">사업부만 의견을 제출할 수 있습니다.</div>
          <div v-else>
            <div v-if="submitted" class="p-4 rounded-xl mb-6" style="background:#F0FDF4; border:1px solid #BBF7D0;">
              <div class="text-sm font-semibold text-green-700">의견이 제출되었습니다.</div>
              <div class="text-xs text-green-600 mt-1">제출 의견: {{ opinion }}</div>
            </div>

            <div class="mb-5">
              <div class="text-sm font-semibold text-gray-700 mb-3">의견 선택</div>
              <div class="flex gap-3">
                <button
                  @click="opinion = '유지'"
                  class="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  :style="opinion === '유지'
                    ? 'background:rgba(16,185,129,0.1); color:#059669; border:2px solid #10B981;'
                    : 'background:#F8FAFC; color:#374151; border:2px solid #E2E8F0;'"
                  :disabled="submitted"
                >유지</button>
                <button
                  @click="opinion = '포기'"
                  class="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  :style="opinion === '포기'
                    ? 'background:rgba(234,0,44,0.1); color:#EA002C; border:2px solid #EA002C;'
                    : 'background:#F8FAFC; color:#374151; border:2px solid #E2E8F0;'"
                  :disabled="submitted"
                >포기</button>
              </div>
            </div>

            <div class="mb-5">
              <div class="text-sm font-semibold text-gray-700 mb-2">의견 내용</div>
              <textarea
                v-model="comment"
                :disabled="submitted"
                rows="4"
                placeholder="의견을 자유롭게 작성해 주세요."
                class="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
                style="border:1px solid #E2E8F0; font-family:inherit;"
              />
            </div>

            <button
              v-if="!submitted"
              @click="submitOpinion"
              :disabled="!opinion"
              class="px-6 py-2.5 text-sm font-semibold text-white rounded-lg cursor-pointer"
              :style="opinion ? 'background:#FF7A00; border:none;' : 'background:#D1D5DB; border:none; cursor:not-allowed;'"
            >의견 제출</button>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
