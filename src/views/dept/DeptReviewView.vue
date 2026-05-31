<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { PATENTS } from '@/data/patents.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('전체')
const infoModal = ref(false)

const myEvalPatents = computed(() =>
  PATENTS.filter((p) => p.dept === auth.currentUser?.dept && p.evaluation?.quarter === '2025-Q1' && p.evaluation?.status !== '요청 전')
)

const reviewStats = computed(() => ({
  total: myEvalPatents.value.length,
  done: myEvalPatents.value.filter((p) => p.evaluation?.replyDate).length,
  pending: myEvalPatents.value.filter((p) => !p.evaluation?.replyDate).length,
}))

const reviewPct = computed(() => {
  if (reviewStats.value.total === 0) return 0
  return Math.round((reviewStats.value.done / reviewStats.value.total) * 100)
})

const filtered = computed(() => {
  if (activeTab.value === '제출 완료') return myEvalPatents.value.filter((p) => p.evaluation?.replyDate)
  if (activeTab.value === '미제출') return myEvalPatents.value.filter((p) => !p.evaluation?.replyDate)
  return myEvalPatents.value
})
</script>

<template>
  <AppLayout title="검토 현황" subtitle="반도체사업부 · 2025년 1분기 재평가 현황">
    <!-- 상단 -->
    <AppCard class="mb-4">
      <div class="flex items-start gap-2">
        <div class="flex items-start gap-2">
          <div>
            <div class="flex items-center gap-2">
              <div class="text-sm font-semibold text-gray-800">2025년 1분기 재평가</div>
              <button
                @click="infoModal = true"
                class="w-6 h-6 rounded-full text-[11px] font-bold cursor-pointer flex items-center justify-center"
                style="background:#F8FAFC; border:1px solid #E2E8F0; color:#6b7280;"
                aria-label="재평가 안내"
              >?</button>
            </div>
            <div class="text-xs text-gray-500 mt-0.5">재평가 대상 {{ reviewStats.total }}건 · 제출 완료 {{ reviewStats.done }}건 · 미제출 {{ reviewStats.pending }}건</div>
          </div>
        </div>
      </div>
    </AppCard>

    <div class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-xl p-4" style="border:1px solid #E2E8F0; background:#F8FAFC;">
          <div class="text-xs font-semibold text-gray-500">재평가 대상</div>
          <div class="mt-1 text-2xl font-bold text-gray-700">전체 {{ reviewStats.total }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(255,122,0,0.25); background:#FFF7F0;">
          <div class="text-xs font-semibold" style="color:#FF7A00;">제출 완료</div>
          <div class="mt-1 text-2xl font-bold" style="color:#FF7A00;">{{ reviewStats.done }}건</div>
        </div>
        <div class="rounded-xl p-4" style="border:1px solid rgba(245,158,11,0.3); background:rgba(245,158,11,0.1);">
          <div class="text-xs font-semibold" style="color:#B45309;">미제출</div>
          <div class="mt-1 text-2xl font-bold" style="color:#F59E0B;">{{ reviewStats.pending }}건</div>
        </div>
      </div>

      <div class="mt-3 rounded-xl p-4" style="border:1px solid #E2E8F0; background:#FFFFFF;">
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm font-semibold text-gray-700">이번 분기 재평가 진행률</div>
          <div class="text-xs text-gray-500">{{ reviewPct }}%</div>
        </div>
        <div class="text-xs text-gray-600 mb-2">2025년 1분기 재평가 {{ reviewStats.total }}건 중 {{ reviewStats.done }}건 완료</div>
        <div class="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div class="h-full rounded-full" style="background:#FF7A00;" :style="`width:${reviewPct}%`" />
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div class="flex gap-6 border-b border-gray-200 mb-4">
      <button
        v-for="tab in ['전체', '제출 완료', '미제출']"
        :key="tab"
        @click="activeTab = tab"
        class="pb-3 text-sm cursor-pointer -mb-px"
        :class="activeTab === tab ? 'border-b-2 border-[#FF7A00] text-[#FF7A00] font-semibold' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab }}</button>
    </div>

    <!-- 테이블 -->
    <div class="bg-white rounded-xl overflow-hidden" style="border:1px solid #E2E8F0;">
      <table class="w-full text-sm">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:1px solid #E2E8F0;">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">출원번호</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">특허명</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">만료일</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500">제출일</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filtered"
            :key="p.id"
            class="cursor-pointer"
            style="border-bottom:1px solid #F1F5F9;"
            @click="router.push(`/patents/${p.id}`)"
            @mouseenter="$event.currentTarget.style.background='#FFF7F0';"
            @mouseleave="$event.currentTarget.style.background='';"
          >
            <td class="px-4 py-3 text-xs font-mono text-gray-600">{{ p.number }}</td>
            <td class="px-4 py-3 text-gray-800 font-medium max-w-xs truncate">{{ p.title }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.expiryDate }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="p.evaluation?.replyDate ? '제출 완료' : '미제출'" />
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ p.evaluation?.replyDate || '-' }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">해당 항목이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 재평가 안내 모달 -->
    <AppModal :show="infoModal" title="재평가 및 제출 안내" width="max-w-2xl" @close="infoModal = false">
      <div class="space-y-4 text-sm text-gray-700">
        <div class="p-4 rounded-lg" style="background:#F8FAFC; border:1px solid #E2E8F0;">
          <div class="font-semibold text-gray-800 mb-2">이 화면의 역할</div>
          <div class="space-y-2 text-gray-600">
            <div>• 사업부가 이번 분기 재평가 대상 특허를 확인하고, 제출 상태를 한눈에 관리하는 화면입니다.</div>
            <div>• 상세 페이지에서 AI 평가 보고서를 검토한 뒤, 유지 또는 포기 의견과 사유를 제출합니다.</div>
            <div>• 제출이 완료되면 상태가 제출 완료로 바뀌고, 제출일이 표에 함께 표시됩니다.</div>
          </div>
        </div>

        <div>
          <div class="font-semibold text-gray-800 mb-2">재평가 흐름</div>
          <div class="space-y-2">
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">1</span>
              <span>Legal팀이 분기별 재평가 대상 특허를 선정하고 사업부에 배정합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">2</span>
              <span>사업부는 특허 상세 페이지에서 출원 정보, AI 평가 점수, 코멘트를 확인합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">3</span>
              <span>유지 또는 포기 의견을 선택하고, 검토 근거를 적어 제출합니다.</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:#FF7A00;">4</span>
              <span>Legal팀은 제출 내역을 확인한 뒤 최종 유지 여부와 후속 조치를 결정합니다.</span>
            </div>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div class="p-3 rounded-lg" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
            <div class="font-semibold mb-1" style="color:#FF7A00;">상태 의미</div>
            <div class="text-xs text-gray-600 space-y-1">
              <div>• 제출 완료: 이번 분기 의견 제출이 끝난 상태</div>
              <div>• 미제출: 아직 의견을 제출하지 않은 상태</div>
              <div>• 제출일: 실제 제출이 완료된 날짜</div>
            </div>
          </div>
          <div class="p-3 rounded-lg" style="background:#FFF7F0; border:1px solid rgba(255,122,0,0.2);">
            <div class="font-semibold mb-1" style="color:#FF7A00;">평가 항목</div>
            <div class="text-xs text-gray-600 space-y-1">
              <div>• 기술성: 기술적 독창성 및 완성도 (0~100)</div>
              <div>• 권리성: 청구항의 범위 및 유효성 (0~100)</div>
              <div>• 사업성: 상업적 활용 가능성 (0~100)</div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </AppLayout>
</template>
